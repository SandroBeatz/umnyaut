import type { ToolModule } from "../types";
import { oboi } from "./oboi";
import { ploshchadKomnaty } from "./ploshchad-komnaty";
import { ploshchadSten } from "./ploshchad-sten";

/** Every calc module by tool id. The id is also the URL segment, content filename and analytics value. */
export const toolModules = {
  "ploshchad-komnaty": ploshchadKomnaty,
  "ploshchad-sten": ploshchadSten,
  oboi,
} as const satisfies Record<string, ToolModule>;

export type ToolId = keyof typeof toolModules;
