import "server-only";
import { type Env, getEnv } from "@server/platform/env";

const DB_TIMEOUT_MS = 2_000;

type DbStatus = "ok" | "skipped" | "error";

export type HealthData = {
  version: string;
  env: Env["APP_ENV"];
  db: DbStatus;
};

export type HealthResult =
  | { ok: true; data: HealthData }
  | { ok: false; error: { code: "db_unreachable"; message: string }; data: HealthData };

/** Pings the Supabase REST gateway with the secret key; `skipped` until the DB is configured (P2.7). */
async function pingDb(env: Env): Promise<DbStatus> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) return "skipped";
  try {
    const response = await fetch(new URL("/rest/v1/", env.SUPABASE_URL), {
      headers: { apikey: env.SUPABASE_SECRET_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(DB_TIMEOUT_MS),
    });
    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function checkHealth(env: Env = getEnv()): Promise<HealthResult> {
  const data: HealthData = {
    version: process.env.APP_VERSION ?? "dev",
    env: env.APP_ENV,
    db: await pingDb(env),
  };
  if (data.db === "error") {
    return { ok: false, error: { code: "db_unreachable", message: "Database ping failed" }, data };
  }
  return { ok: true, data };
}
