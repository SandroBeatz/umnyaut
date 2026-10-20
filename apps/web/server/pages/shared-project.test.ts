import "server-only";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  rows: new Map<string, unknown>(),
  opens: [] as string[],
  reads: 0,
}));

vi.mock("@umnyaut/db", async (importActual) => ({
  DbError: (await importActual<typeof import("@umnyaut/db")>()).DbError,
  createDb: () => ({}),
  getProject: async (_db: unknown, id: string) => {
    db.reads += 1;
    return db.rows.has(id) ? { id, data: db.rows.get(id), schemaVersion: 2, country: "RU", updatedAt: "" } : null;
  },
  touchProject: async (_db: unknown, id: string) => {
    db.opens.push(id);
    return true;
  },
  hitLimit: async () => true,
}));
vi.mock("next/server", () => ({ after: (task: () => unknown) => task() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }) }));

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return (await import("./shared-project")).loadSharedProject;
}

const withDb = { SUPABASE_URL: "https://db.example.com", SUPABASE_SECRET_KEY: "sb_secret_x" };

describe("loadSharedProject", () => {
  beforeEach(() => {
    db.rows.clear();
    db.opens.length = 0;
    db.reads = 0;
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns the stored data and counts the open", async () => {
    db.rows.set("abcd2345", { schemaVersion: 2 });
    const loadSharedProject = await load(withDb);
    expect(await loadSharedProject("abcd2345")).toEqual({ data: { schemaVersion: 2 } });
    expect(db.opens).toEqual(["abcd2345"]);
  });

  it("is null for a malformed or unknown id, and without a DB", async () => {
    let loadSharedProject = await load(withDb);
    expect(await loadSharedProject("../x")).toBeNull();
    expect(db.reads).toBe(0);
    expect(await loadSharedProject("zzzz2345")).toBeNull();
    loadSharedProject = await load({ SUPABASE_URL: "", SUPABASE_SECRET_KEY: "" });
    expect(await loadSharedProject("abcd2345")).toBeNull();
  });

  it("is null past the read limit", async () => {
    db.rows.set("abcd2345", {});
    const loadSharedProject = await load(withDb);
    // `cache()` only dedupes inside a request; in a test every call counts.
    const results = [];
    for (let i = 0; i < 121; i++) results.push(await loadSharedProject("abcd2345"));
    expect(results.filter((r) => r === null)).toHaveLength(1);
    expect(results.at(-1)).toBeNull();
  });
});
