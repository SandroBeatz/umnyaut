import "server-only";
import { addEvent, getDb } from "@server/db";
import { ApiError, handle, readJson } from "@server/http";
import { LIMITS } from "@server/limits";
import { toolModules } from "@umnyaut/calc";
import { z } from "zod";

/** The events the own counter takes: the names of `EventMap` (src/shared/analytics/events.ts, checked in tests). */
export const COUNTED_EVENTS = [
  "tool_view",
  "calc_started",
  "calc_completed",
  "calc_adjusted",
  "price_added",
  "how_opened",
  "next_tool_clicked",
  "project_shared",
  "result_copied",
  "js_error",
] as const;

const TOOLS: ReadonlySet<string> = new Set(Object.keys(toolModules));
const COUNTRIES: ReadonlySet<string> = new Set(["RU", "KZ", "BY", "KG"]);
const SOURCES = ["web", "tg", "embed"] as const;

/**
 * Only the event's name and its tool, country and source (tech spec §14): anything else in the body is dropped, so
 * the counter can hold no dimensions, prices or texts. An unknown tool or country counts as none, not as an error.
 */
const eventSchema = z.object({
  event: z.enum(COUNTED_EVENTS),
  tool: z.string().optional(),
  country: z.string().optional(),
  source: z.enum(SOURCES).catch("web"),
});

/** `POST /api/e/` — the anonymous counter behind `track()` (`sendBeacon`, no cookies, no ids): adds 1 to today's total. */
export function postEvent(request: Request): Promise<Response> {
  return handle(request, { route: "/api/e", limit: LIMITS.event }, async () => {
    const db = getDb();
    if (!db) throw new ApiError("db_unavailable", "No database in this environment");
    const { event, tool, country, source } = await readJson(request, eventSchema);
    await addEvent(db, {
      event,
      tool: tool && TOOLS.has(tool) ? tool : "",
      country: country && COUNTRIES.has(country) ? country : "",
      source,
    });
    return new Response(null, { status: 204 });
  });
}
