import "server-only";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEnv } from "../platform/env";
import { checkHealth } from "./check";

const withDb = parseEnv({ SUPABASE_URL: "https://db.example.com", SUPABASE_SECRET_KEY: "sb_secret_x" });

describe("checkHealth", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("skips the DB ping until Supabase is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await checkHealth(parseEnv({}));
    expect(result).toMatchObject({ ok: true, data: { db: "skipped", env: "local" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports ok when the REST gateway answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await checkHealth(withDb);
    expect(result).toMatchObject({ ok: true, data: { db: "ok" } });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://db.example.com/rest/v1/");
    expect(init.headers).toEqual({ apikey: "sb_secret_x" });
  });

  it("fails when the DB is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const result = await checkHealth(withDb);
    expect(result).toMatchObject({ ok: false, error: { code: "db_unreachable" }, data: { db: "error" } });
  });

  it("fails on a non-2xx answer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));
    expect((await checkHealth(withDb)).ok).toBe(false);
  });
});
