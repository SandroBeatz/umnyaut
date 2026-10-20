import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeEach, describe, expect, it } from "vitest";

/**
 * The migrations on PGlite (Postgres in WASM), so the SQL is checked without the Docker stack. What Supabase has and
 * PGlite lacks is stubbed: the API roles, the `extensions` schema and `cron.schedule` (pg_cron is not in PGlite).
 */
const dir = join(import.meta.dirname, "../supabase/migrations");
const migrations = readdirSync(dir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => ({ name, sql: readFileSync(join(dir, name), "utf8") }));

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema extensions;
  -- What Supabase grants on public by default; 0001 has to take it back from the publishable-key roles.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  create schema cron;
  create table cron.job (jobname text primary key, schedule text not null, command text not null);
  create function cron.schedule(p_name text, p_schedule text, p_command text) returns bigint language sql as $$
    insert into cron.job values (p_name, p_schedule, p_command)
    on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command;
    select 1::bigint;
  $$;
`;

async function migratedDb(): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  for (const { sql } of migrations) await db.exec(sql.replace(/^create extension if not exists pg_cron.*$/m, ""));
  return db;
}

const HASH = "a".repeat(64);
const DATA = JSON.stringify({ schemaVersion: 2 });

async function insertProject(db: PGlite, id: string, data = DATA) {
  await db.query(
    "insert into public.projects (id, data, schema_version, country, edit_token_hash) values ($1, $2, 2, 'RU', $3)",
    [id, data, HASH],
  );
}

async function scalar<T>(db: PGlite, sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await db.query<{ v: T }>(sql, params);
  return (rows[0] as { v: T }).v;
}

describe("migrations", () => {
  let db: PGlite;
  beforeEach(async () => {
    db = await migratedDb();
  });

  it("are numbered NNNN_name.sql without gaps", () => {
    expect(migrations.map((m) => m.name.slice(0, 4))).toEqual(migrations.map((_, i) => String(i + 1).padStart(4, "0")));
    for (const { name } of migrations) expect(name).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
  });

  it("enable RLS on every public table and add no policy", async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'",
    );
    expect(rows.map((r) => r.relname).sort()).toEqual([
      "error_reports",
      "events_daily",
      "project_opens",
      "projects",
      "rate_limits",
    ]);
    for (const row of rows) expect(row.relrowsecurity, row.relname).toBe(true);
    expect(await scalar(db, "select count(*)::int as v from pg_policies where schemaname = 'public'")).toBe(0);
  });

  it("give the publishable-key roles nothing", async () => {
    for (const role of ["anon", "authenticated"]) {
      for (const table of ["projects", "project_opens", "rate_limits", "events_daily", "error_reports"]) {
        expect(
          await scalar(db, "select has_table_privilege($1, $2, 'select, insert, update, delete') as v", [
            role,
            `public.${table}`,
          ]),
          `${role} on ${table}`,
        ).toBe(false);
      }
      for (const fn of [
        "hit_limit(text,integer,integer)",
        "project_touch(text)",
        "event_add(text,text,text,text,integer)",
        "cleanup()",
      ]) {
        expect(
          await scalar(db, "select has_function_privilege($1, $2, 'execute') as v", [role, `public.${fn}`]),
          `${role} on ${fn}`,
        ).toBe(false);
      }
    }
    expect(
      await scalar(
        db,
        "select has_function_privilege('service_role', 'public.hit_limit(text,integer,integer)', 'execute') as v",
      ),
    ).toBe(true);
    for (const table of ["projects", "project_opens", "rate_limits", "events_daily", "error_reports"]) {
      expect(
        await scalar(db, "select has_table_privilege('service_role', $1, 'select, insert, update, delete') as v", [
          `public.${table}`,
        ]),
        table,
      ).toBe(true);
    }
  });

  it("schedule the daily cleanup", async () => {
    expect(await scalar(db, "select command as v from cron.job where jobname = 'umnyaut-cleanup'")).toBe(
      "select public.cleanup()",
    );
  });
});

describe("projects", () => {
  let db: PGlite;
  beforeEach(async () => {
    db = await migratedDb();
  });

  it("accept ids without look-alikes only", async () => {
    await insertProject(db, "abcd2345");
    for (const id of ["abcd234O", "abcd2340", "abcd234l", "abcd234I", "abcd234o", "abcd2341", "abc2345", "abcd23456"]) {
      await expect(insertProject(db, id), id).rejects.toThrow();
    }
  });

  it("take any data within the server's 32 KB of compact JSON, refuse far bigger", async () => {
    // Many short keys: jsonb text adds a space after every `:` and `,`, the worst case for the guard.
    const dense = JSON.stringify(Object.fromEntries(Array.from({ length: 2_400 }, (_, i) => [`k${i}`, i])));
    const near32k = JSON.stringify({ ...JSON.parse(dense), pad: "x".repeat(32_768 - dense.length - 10) });
    expect(near32k.length).toBeLessThanOrEqual(32_768);
    await insertProject(db, "abcd2345", near32k);
    await expect(insertProject(db, "efgh6789", JSON.stringify({ s: "x".repeat(70_000) }))).rejects.toThrow();
  });

  it("count a return only after an hour", async () => {
    await insertProject(db, "abcd2345");
    expect(await scalar(db, "select public.project_touch('abcd2345') as v")).toBe(true);
    expect(await scalar(db, "select count(*)::int as v from public.project_opens")).toBe(0);

    await db.exec("update public.projects set last_opened_at = now() - interval '2 hours'");
    expect(await scalar(db, "select public.project_touch('abcd2345') as v")).toBe(true);
    await db.exec("update public.projects set last_opened_at = now() - interval '2 hours'");
    await db.query("select public.project_touch('abcd2345')");
    expect(await scalar(db, "select count::int as v from public.project_opens")).toBe(2);
    expect(await scalar(db, "select last_opened_at > now() - interval '1 minute' as v from public.projects")).toBe(
      true,
    );
  });

  it("say a missing project is missing", async () => {
    expect(await scalar(db, "select public.project_touch('zzzz2345') as v")).toBe(false);
  });
});

describe("hit_limit", () => {
  it("allows max hits per window, then refuses", async () => {
    const db = await migratedDb();
    const hit = () => scalar<boolean>(db, "select public.hit_limit('k', 2, 3600) as v");
    expect([await hit(), await hit(), await hit()]).toEqual([true, true, false]);
    expect(await scalar(db, "select public.hit_limit('other', 2, 3600) as v")).toBe(true);
  });

  it("starts a new window", async () => {
    const db = await migratedDb();
    await db.query("select public.hit_limit('k', 1, 3600)");
    await db.exec("update public.rate_limits set window_start = window_start - interval '1 hour'");
    expect(await scalar(db, "select public.hit_limit('k', 1, 3600) as v")).toBe(true);
  });
});

describe("event_add", () => {
  it("adds to today's total per event, tool, country and source", async () => {
    const db = await migratedDb();
    await db.query("select public.event_add('calc_completed', 'laminat', 'RU', 'web')");
    await db.query("select public.event_add('calc_completed', 'laminat', 'RU', 'web', 3)");
    await db.query("select public.event_add('calc_completed', 'laminat', 'KZ', 'web')");
    const { rows } = await db.query<{ country: string; count: number }>(
      "select country, count from public.events_daily order by country",
    );
    expect(rows).toEqual([
      { country: "KZ", count: 1 },
      { country: "RU", count: 4 },
    ]);
  });
});

describe("cleanup", () => {
  it("drops projects unopened for 12 months with their opens, year-old reports and old limit windows", async () => {
    const db = await migratedDb();
    await insertProject(db, "abcd2345");
    await insertProject(db, "efgh6789");
    await db.exec(`
      insert into public.project_opens values ('abcd2345', current_date - 400, 1);
      update public.projects set last_opened_at = now() - interval '13 months' where id = 'abcd2345';
      update public.projects set last_opened_at = now() - interval '11 months' where id = 'efgh6789';
      insert into public.error_reports (message, created_at) values ('old', now() - interval '13 months'), ('new', now());
      insert into public.rate_limits values ('old', now() - interval '25 hours', 1), ('new', now(), 1);
      select public.cleanup();
    `);
    expect((await db.query("select id from public.projects")).rows).toEqual([{ id: "efgh6789" }]);
    expect(await scalar(db, "select count(*)::int as v from public.project_opens")).toBe(0);
    expect((await db.query("select message from public.error_reports")).rows).toEqual([{ message: "new" }]);
    expect((await db.query("select key from public.rate_limits")).rows).toEqual([{ key: "new" }]);
  });
});
