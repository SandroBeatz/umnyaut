import "server-only";
import { createHmac } from "node:crypto";
import { getDb } from "@server/db";
import { getClientIp, getEnv } from "@server/platform";
import { DbError, hitLimit } from "@umnyaut/db";
import { MemoryLimiter } from "./memory";

export { MemoryLimiter } from "./memory";

export interface LimitRule {
  /** Part of the key: one counter per rule and client. */
  name: string;
  max: number;
  windowSeconds: number;
  /** `memory` for per-minute bursts, `db` for hourly and daily limits that must survive a restart. */
  store: "memory" | "db";
}

/** API limits (tech spec §9). */
export const LIMITS = {
  projectCreate: { name: "project-create", max: 20, windowSeconds: 3600, store: "db" },
  projectRead: { name: "project-read", max: 120, windowSeconds: 60, store: "memory" },
  projectUpdate: { name: "project-update", max: 60, windowSeconds: 60, store: "memory" },
  projectDelete: { name: "project-delete", max: 20, windowSeconds: 3600, store: "db" },
  report: { name: "report", max: 5, windowSeconds: 3600, store: "db" },
  event: { name: "event", max: 300, windowSeconds: 60, store: "memory" },
} as const satisfies Record<string, LimitRule>;

const memory = new MemoryLimiter();

/**
 * The client as a salted daily hash: the raw IP is never stored or logged (tech spec §16). The salt is derived from
 * the secret key and the date, so yesterday's keys cannot be linked to today's.
 */
export function clientKey(ip: string | null, now: Date, secret: string): string {
  const day = now.toISOString().slice(0, 10);
  const salt = createHmac("sha256", secret).update(day).digest();
  return createHmac("sha256", salt)
    .update(ip ?? "unknown")
    .digest("base64url")
    .slice(0, 22);
}

/** Counts this request against the rule; `false` = over the limit (answer 429). Takes the request's headers. */
export async function checkLimit(headers: Headers, rule: LimitRule): Promise<boolean> {
  const now = new Date();
  const key = `${rule.name}:${clientKey(getClientIp(headers), now, getEnv().SUPABASE_SECRET_KEY ?? "local")}`;
  const db = rule.store === "db" ? getDb() : null;
  // Without a DB (staging) every rule falls back to memory.
  if (!db) return memory.hit(key, rule.max, rule.windowSeconds * 1000, now.getTime());
  try {
    return await hitLimit(db, key, rule.max, rule.windowSeconds);
  } catch (error) {
    // A paused or unreachable DB must not turn the limit itself into a 500: count in memory meanwhile.
    if (!(error instanceof DbError)) throw error;
    console.error("[limits] hit_limit failed, counting in memory", error.message);
    return memory.hit(key, rule.max, rule.windowSeconds * 1000, now.getTime());
  }
}
