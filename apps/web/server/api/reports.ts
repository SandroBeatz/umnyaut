import "server-only";
import { getDb, saveReport } from "@server/db";
import { ApiError, handle, ok, readJson } from "@server/http";
import { LIMITS } from "@server/limits";
import type { Json } from "@umnyaut/db";
import { z } from "zod";

const INPUT_MAX = 32 * 1024;

const reportSchema = z.object({
  tool: z.string().trim().max(40).optional(),
  toolVersion: z.int().min(0).max(2_147_483_647).optional(),
  input: z
    .record(z.string(), z.unknown())
    .refine((input) => Buffer.byteLength(JSON.stringify(input)) <= INPUT_MAX)
    .optional(),
  message: z.string().trim().min(1).max(2000),
  pageUrl: z.string().max(500).optional(),
  /** Honeypot: a hidden field people leave empty and bots fill. */
  website: z.string().optional(),
});

const PAGE_PATH_MAX = 500;

/**
 * Only our own pages, as a path: the report never stores someone's full URL with a query string. Percent-encoding
 * can make the path longer than the URL sent, so it is cut to the column's limit.
 */
function pagePath(pageUrl: string | undefined): string | undefined {
  if (!pageUrl) return undefined;
  try {
    return new URL(pageUrl, "https://umnyaut.com").pathname.slice(0, PAGE_PATH_MAX);
  } catch {
    return undefined;
  }
}

/** `POST /api/reports/` — «Сообщить об ошибке». A filled honeypot gets the same answer and is dropped. */
export function postReport(request: Request): Promise<Response> {
  return handle(request, { route: "/api/reports", limit: LIMITS.report }, async () => {
    const db = getDb();
    if (!db) throw new ApiError("db_unavailable", "No database in this environment");
    const { website, pageUrl, input, ...report } = await readJson(request, reportSchema);
    if (!website) {
      await saveReport(db, { ...report, input: input as Json | undefined, pageUrl: pagePath(pageUrl) });
    }
    return ok({ received: true }, 201);
  });
}
