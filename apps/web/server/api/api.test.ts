import "server-only";
import type { ProjectData } from "@umnyaut/calc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventName } from "@/shared/analytics";

/**
 * Route handlers end to end against an in-memory stand-in for `@umnyaut/db`: the queries' contract (insert says
 * whether the id was free, update/delete match id and token hash, limits count per key) without the Docker stack.
 * The SQL itself is tested on PGlite in packages/db.
 */
const fake = vi.hoisted(() => {
  type Row = { id: string; data: unknown; schemaVersion: number; country: string; hash: string; updatedAt: string };
  const state = {
    projects: new Map<string, Row>(),
    opens: [] as string[],
    reports: [] as unknown[],
    events: [] as unknown[],
    limits: new Map<string, number>(),
  };
  return {
    state,
    reset() {
      state.projects.clear();
      state.opens.length = 0;
      state.reports.length = 0;
      state.events.length = 0;
      state.limits.clear();
    },
    db: {
      createDb: () => ({}),
      async insertProject(_db: unknown, p: Omit<Row, "hash" | "updatedAt"> & { editTokenHash: string }) {
        if (state.projects.has(p.id)) return false;
        const { editTokenHash, ...rest } = p;
        state.projects.set(p.id, { ...rest, hash: editTokenHash, updatedAt: "2026-10-20T00:00:00Z" });
        return true;
      },
      async getProject(_db: unknown, id: string) {
        const row = state.projects.get(id);
        if (!row) return null;
        const { hash: _h, ...rest } = row;
        return rest;
      },
      async updateProject(_db: unknown, id: string, hash: string, p: Pick<Row, "data" | "schemaVersion" | "country">) {
        const row = state.projects.get(id);
        if (!row || row.hash !== hash) return null;
        Object.assign(row, p, { updatedAt: "2026-10-20T01:00:00Z" });
        return { updatedAt: row.updatedAt };
      },
      async deleteProject(_db: unknown, id: string, hash: string) {
        const row = state.projects.get(id);
        if (!row || row.hash !== hash) return false;
        return state.projects.delete(id);
      },
      async touchProject(_db: unknown, id: string) {
        state.opens.push(id);
        return state.projects.has(id);
      },
      async hitLimit(_db: unknown, key: string, max: number) {
        const count = (state.limits.get(key) ?? 0) + 1;
        state.limits.set(key, count);
        return count <= max;
      },
      async insertReport(_db: unknown, report: unknown) {
        state.reports.push(report);
      },
      async addEvent(_db: unknown, event: unknown) {
        state.events.push(event);
      },
    },
  };
});

// Each export calls through `fake.db`, so a test can spy on one query.
vi.mock("@umnyaut/db", async (importActual) => ({
  ...Object.fromEntries(
    Object.keys(fake.db).map((name) => [
      name,
      (...args: unknown[]) => (fake.db as Record<string, (...a: unknown[]) => unknown>)[name]?.(...args),
    ]),
  ),
  DbError: (await importActual<typeof import("@umnyaut/db")>()).DbError,
}));
// `after()` needs a request scope; here the task simply runs.
vi.mock("next/server", () => ({ after: (task: () => unknown) => task() }));

const ORIGIN = "https://umnyaut.com";
const estimate: ProjectData = {
  schemaVersion: 2,
  id: "est",
  name: "Ремонт квартиры",
  country: "KZ",
  rooms: [{ id: "r1", name: "Кухня", type: "kitchen", lengthMm: 4600, widthMm: 4300, heightMm: 2700 }],
  calcs: [{ id: "c1", roomId: "r1", tool: "laminat", toolVersion: 3, input: {}, openedAt: 1, addedAt: 1 }],
  prices: {},
  updatedAt: 1,
};

function request(
  method: string,
  path: string,
  init: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { host: "umnyaut.com", "x-forwarded-for": "203.0.113.7", ...init.headers };
  if (method !== "GET") headers.origin ??= ORIGIN;
  if (init.token) headers["x-edit-token"] = init.token;
  if (init.body !== undefined) headers["content-type"] = "application/json";
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers,
    body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body),
  });
}

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("./index");
}

const withDb = { SUPABASE_URL: "https://db.example.com", SUPABASE_SECRET_KEY: "sb_secret_x" };

describe("projects API", () => {
  let api: Awaited<ReturnType<typeof load>>;
  beforeEach(async () => {
    fake.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    api = await load(withDb);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  async function create(data: unknown = estimate) {
    const response = await api.postProject(request("POST", "/api/projects/", { body: { data } }));
    return { response, body: await response.json() };
  }

  it("creates a snapshot and returns id and editToken; the DB keeps only the hash", async () => {
    const { response, body } = await create();
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.data.id).toMatch(/^[2-9a-kmnp-zA-HJ-NP-Z]{8}$/);
    expect(body.data.editToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const row = fake.state.projects.get(body.data.id);
    expect(row).toMatchObject({ schemaVersion: 2, country: "KZ" });
    expect(row?.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain(body.data.editToken);
  });

  it("reads a snapshot by id and counts the open", async () => {
    const { body } = await create();
    const response = await api.getProject(request("GET", `/api/projects/${body.data.id}/`), body.data.id);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ id: body.data.id, data: { name: "Ремонт квартиры" } });
    expect(fake.state.opens).toEqual([body.data.id]);
  });

  it("answers 404 for unknown and malformed ids", async () => {
    for (const id of ["zzzz2345", "../../etc", "OOOOOOOO"]) {
      const response = await api.getProject(request("GET", "/api/projects/x/"), id);
      expect(response.status, id).toBe(404);
      expect(await response.json()).toMatchObject({ ok: false, error: { code: "not_found" } });
    }
  });

  it("lets the owner refresh the same link and nobody else", async () => {
    const { body } = await create();
    const { id, editToken } = body.data;
    const next = { ...estimate, name: "Ремонт дачи" };

    const stranger = await api.putProject(
      request("PUT", `/api/projects/${id}/`, { body: { data: next }, token: "x".repeat(43) }),
      id,
    );
    expect(stranger.status).toBe(404);
    const noToken = await api.putProject(request("PUT", `/api/projects/${id}/`, { body: { data: next } }), id);
    expect(noToken.status).toBe(404);

    const owner = await api.putProject(
      request("PUT", `/api/projects/${id}/`, { body: { data: next }, token: editToken }),
      id,
    );
    expect(owner.status).toBe(200);
    expect(fake.state.projects.get(id)?.data).toMatchObject({ name: "Ремонт дачи" });
  });

  it("lets the owner delete the link", async () => {
    const { body } = await create();
    const { id, editToken } = body.data;
    expect(
      (await api.deleteProject(request("DELETE", `/api/projects/${id}/`, { token: "y".repeat(43) }), id)).status,
    ).toBe(404);
    expect((await api.deleteProject(request("DELETE", `/api/projects/${id}/`, { token: editToken }), id)).status).toBe(
      200,
    );
    expect(fake.state.projects.has(id)).toBe(false);
  });

  it("refuses data that is not estimate schema 2", async () => {
    for (const data of [
      {},
      { ...estimate, schemaVersion: 1 },
      { ...estimate, calcs: [{ ...estimate.calcs[0], roomId: "nope" }] },
    ]) {
      const { response, body } = await create(data);
      expect(response.status).toBe(400);
      expect(body.error.code).toBe("invalid_body");
    }
    expect(fake.state.projects.size).toBe(0);
  });

  it("refuses data over 32 KB and bodies over 64 KB", async () => {
    const big = {
      ...estimate,
      prices: Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`item-${i}-xxxx`, i])),
    };
    expect((await create(big)).response.status).toBe(413);
    const huge = await api.postProject(request("POST", "/api/projects/", { body: "x".repeat(70_000) }));
    expect(huge.status).toBe(413);
  });

  it("refuses cross-origin writes", async () => {
    const response = await api.postProject(
      request("POST", "/api/projects/", { body: { data: estimate }, headers: { origin: "https://evil.example" } }),
    );
    expect(response.status).toBe(403);
    expect(fake.state.projects.size).toBe(0);
  });

  it("answers 429 after 20 creations an hour from one client", async () => {
    for (let i = 0; i < 20; i++) expect((await create()).response.status).toBe(201);
    const { response, body } = await create();
    expect(response.status).toBe(429);
    expect(body.error.code).toBe("rate_limited");
    expect(response.headers.get("retry-after")).toBe("3600");
    expect([...fake.state.limits.keys()].join()).not.toContain("203.0.113.7");
  });

  it("answers 429 after 120 reads a minute from one client", async () => {
    const { body } = await create();
    for (let i = 0; i < 120; i++) await api.getProject(request("GET", "/api/projects/x/"), body.data.id);
    expect((await api.getProject(request("GET", "/api/projects/x/"), body.data.id)).status).toBe(429);
  });

  it("answers 400, not 500, when a DB check refuses the data", async () => {
    // The class from the same module graph as the handlers (`load()` resets modules).
    const { DbError } = await import("@umnyaut/db");
    vi.spyOn(fake.db, "insertProject").mockRejectedValueOnce(new DbError("insertProject", "23514", "check"));
    const { response, body } = await create();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_body");
  });

  it("keeps limiting in memory when hit_limit fails", async () => {
    // The class from the same module graph as the handlers (`load()` resets modules).
    const { DbError } = await import("@umnyaut/db");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(fake.db, "hitLimit").mockRejectedValue(new DbError("hitLimit", "57P01", "paused"));
    for (let i = 0; i < 20; i++) expect((await create()).response.status).toBe(201);
    expect((await create()).response.status).toBe(429);
    expect(vi.mocked(console.error)).toHaveBeenCalledWith(
      "[limits] hit_limit failed, counting in memory",
      "hitLimit: paused",
    );
  });

  it("logs route, method, status and duration only", async () => {
    const info = vi.mocked(console.info);
    const { body } = await create();
    await api.getProject(request("GET", `/api/projects/${body.data.id}/`), body.data.id);
    const lines = info.mock.calls.map((call) => String(call[0]));
    expect(lines[0]).toMatch(/^\[api\] POST \/api\/projects 201 \d+ms$/);
    expect(lines[1]).toMatch(/^\[api\] GET \/api\/projects\/\[id\] 200 \d+ms$/);
    expect(lines.join()).not.toContain(body.data.id);
  });
});

describe("reports API", () => {
  let api: Awaited<ReturnType<typeof load>>;
  beforeEach(async () => {
    fake.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    api = await load(withDb);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const report = {
    tool: "laminat",
    toolVersion: 3,
    input: { packM2: 2.13 },
    message: "Не сходится число упаковок",
    pageUrl: "https://umnyaut.com/pol/laminat/?s=abc",
  };

  it("stores a report with the page path only", async () => {
    const response = await api.postReport(request("POST", "/api/reports/", { body: report }));
    expect(response.status).toBe(201);
    expect(fake.state.reports).toEqual([
      {
        tool: "laminat",
        toolVersion: 3,
        input: { packM2: 2.13 },
        message: "Не сходится число упаковок",
        pageUrl: "/pol/laminat/",
      },
    ]);
  });

  it("answers a filled honeypot the same way and drops it", async () => {
    const response = await api.postReport(
      request("POST", "/api/reports/", { body: { ...report, website: "http://spam" } }),
    );
    expect(response.status).toBe(201);
    expect(fake.state.reports).toEqual([]);
  });

  it("refuses an empty message", async () => {
    expect((await api.postReport(request("POST", "/api/reports/", { body: { message: "  " } }))).status).toBe(400);
  });

  it("allows 5 reports an hour", async () => {
    for (let i = 0; i < 5; i++) await api.postReport(request("POST", "/api/reports/", { body: report }));
    expect((await api.postReport(request("POST", "/api/reports/", { body: report }))).status).toBe(429);
    expect(fake.state.reports).toHaveLength(5);
  });
});

describe("events API", () => {
  let api: Awaited<ReturnType<typeof load>>;
  beforeEach(async () => {
    fake.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    api = await load(withDb);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const send = (body: unknown, headers?: Record<string, string>) =>
    api.postEvent(request("POST", "/api/e/", { body, ...(headers ? { headers } : {}) }));

  it("counts the event with its tool, country and source only", async () => {
    const response = await send({
      event: "calc_completed",
      tool: "laminat",
      country: "KZ",
      source: "web",
      fieldsChanged: 3,
      via: "panel",
      area: 18,
    });
    expect(response.status).toBe(204);
    expect(fake.state.events).toEqual([{ event: "calc_completed", tool: "laminat", country: "KZ", source: "web" }]);
  });

  it("counts an unknown tool, country or source as none", async () => {
    await send({ event: "tool_view", tool: "../etc", country: "US", source: "bot" });
    await send({ event: "js_error" });
    expect(fake.state.events).toEqual([
      { event: "tool_view", tool: "", country: "", source: "web" },
      { event: "js_error", tool: "", country: "", source: "web" },
    ]);
  });

  it("refuses events it does not know and other sites", async () => {
    expect((await send({ event: "drop_table" })).status).toBe(400);
    expect((await send({ event: "tool_view" }, { origin: "https://evil.example" })).status).toBe(403);
    expect(fake.state.events).toEqual([]);
  });

  it("allows 300 events a minute", async () => {
    for (let i = 0; i < 300; i++) await send({ event: "tool_view" });
    expect((await send({ event: "tool_view" })).status).toBe(429);
    expect(fake.state.events).toHaveLength(300);
  });

  it("knows every event of EventMap and nothing else", () => {
    // A name missing on either side fails tsc here.
    type Counted = (typeof api.COUNTED_EVENTS)[number];
    const same: [Exclude<EventName, Counted> | Exclude<Counted, EventName>] extends [never] ? true : false = true;
    expect(same).toBe(true);
  });
});

describe("without a database (staging, previews)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("answers 503 db_unavailable", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const api = await load({ SUPABASE_URL: "", SUPABASE_SECRET_KEY: "" });
    const response = await api.postProject(request("POST", "/api/projects/", { body: { data: estimate } }));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("db_unavailable");
  });
});
