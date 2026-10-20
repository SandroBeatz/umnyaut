import "server-only";
import { getEnv } from "@server/platform/env";
import { createDb, type Db } from "@umnyaut/db";

let cached: Db | undefined;

/** The one DB client of the process; `null` where no database is configured (staging, previews). */
export function getDb(): Db | null {
  if (cached) return cached;
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = getEnv();
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  cached = createDb(SUPABASE_URL, SUPABASE_SECRET_KEY);
  return cached;
}
