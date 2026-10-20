import "server-only";
import { getDb, markProjectOpen, PROJECT_ID, readProject } from "@server/db";
import { checkLimit, LIMITS } from "@server/limits";
import { runAfter } from "@server/platform";
import { headers } from "next/headers";
import { cache } from "react";

/**
 * `/p/<id>`: the stored snapshot as is (the browser migrates it), or `null` → 404 — no such id, no DB here, or the
 * reader is over the read limit (same answer, so the limit gives nothing away). Shares the API's read limit and
 * counts the open after the response. `cache()`: the page and its metadata read once per request.
 */
export const loadSharedProject = cache(async (id: string): Promise<{ data: unknown } | null> => {
  if (!PROJECT_ID.test(id)) return null;
  const db = getDb();
  if (!db) return null;
  if (!(await checkLimit(await headers(), LIMITS.projectRead))) return null;
  const project = await readProject(db, id);
  if (!project) return null;
  runAfter(() => markProjectOpen(db, id));
  return { data: project.data };
});
