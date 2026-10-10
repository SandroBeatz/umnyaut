import type { ToolModule } from "../types";
import { klej } from "./klej";
import { kraska } from "./kraska";
import { linoleum } from "./linoleum";
import { oboi } from "./oboi";
import { plintus } from "./plintus";
import { ploshchadKomnaty } from "./ploshchad-komnaty";
import { ploshchadSten } from "./ploshchad-sten";
import { zatirka } from "./zatirka";

/** Every calc module by tool id. The id is also the URL segment, content filename and analytics value. */
export const toolModules = {
  "ploshchad-komnaty": ploshchadKomnaty,
  "ploshchad-sten": ploshchadSten,
  oboi,
  kraska,
  plintus,
  klej,
  zatirka,
  linoleum,
} as const satisfies Record<string, ToolModule>;

export type ToolId = keyof typeof toolModules;
