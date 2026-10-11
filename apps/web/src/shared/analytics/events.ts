import type { ToolId } from "@umnyaut/calc";

/**
 * Every analytics event and its parameters (docs/business/seo-and-analytics.md → Events). Only tool ids and
 * counts: never dimensions, prices or texts. Events of later phases (projects, AI, shops) join with them.
 */
export type EventMap = {
  tool_view: { tool: ToolId };
  /** First field change. */
  calc_started: { tool: ToolId };
  /** ≥ 2 fields changed and the result seen for 5 s, in the panel or the sticky bar. */
  calc_completed: { tool: ToolId; fieldsChanged: number; via: "panel" | "sticky" };
  /** A change after a useful calculation. */
  calc_adjusted: { tool: ToolId };
  price_added: { tool: ToolId; item: string };
  how_opened: { tool: ToolId };
  next_tool_clicked: { tool: ToolId; next: ToolId };
  project_shared: { channel: "link" | "text" | "print" | "telegram" };
  result_copied: { tool: ToolId };
  js_error: { tool?: ToolId };
};

export type EventName = keyof EventMap;
