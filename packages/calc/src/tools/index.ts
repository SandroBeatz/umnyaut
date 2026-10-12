import { module as klej } from "../modules/klej";
import { module as kraska } from "../modules/kraska";
import { module as laminat } from "../modules/laminat";
import { module as linoleum } from "../modules/linoleum";
import { module as oboi } from "../modules/oboi";
import { module as plintus } from "../modules/plintus";
import { module as plitka } from "../modules/plitka";
import { module as ploshchadKomnaty } from "../modules/ploshchad-komnaty";
import { module as ploshchadSten } from "../modules/ploshchad-sten";
import { module as zatirka } from "../modules/zatirka";
import type { ToolModule } from "../types";

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
  laminat,
  plitka,
} as const satisfies Record<string, ToolModule>;

export type ToolId = keyof typeof toolModules;
