import type { Db } from "../client";
import { fail } from "./error";

export interface EventCount {
  event: string;
  tool?: string;
  country?: string;
  source?: string;
  count?: number;
}

/** Adds to today's anonymous total of an event (`events_daily`). */
export async function addEvent(db: Db, { event, tool = "", country = "", source = "", count = 1 }: EventCount) {
  const { error } = await db.rpc("event_add", {
    p_event: event,
    p_tool: tool,
    p_country: country,
    p_source: source,
    p_count: count,
  });
  if (error) fail("addEvent", error);
}
