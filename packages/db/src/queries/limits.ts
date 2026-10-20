import type { Db } from "../client";
import { fail } from "./error";

/** Counts a hit in the current fixed window; `true` while the key is within `max`. */
export async function hitLimit(db: Db, key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await db.rpc("hit_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) fail("hitLimit", error);
  return data;
}
