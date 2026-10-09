import type { ToolModule } from "../types";
import { ploshchadKomnaty } from "./ploshchad-komnaty";

/** Every calc module by tool id. The id is also the URL segment, content filename and analytics value. */
export const toolModules = {
  "ploshchad-komnaty": ploshchadKomnaty,
} as const satisfies Record<string, ToolModule>;

export type ToolId = keyof typeof toolModules;
