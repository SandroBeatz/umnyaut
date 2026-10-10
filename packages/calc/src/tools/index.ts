import type { ToolModule } from "../types";
import { klej } from "./klej";
import { kraska } from "./kraska";
import { laminat } from "./laminat";
import { linoleum } from "./linoleum";
import { oboi } from "./oboi";
import { plintus } from "./plintus";
import { plitka } from "./plitka";
import { ploshchadKomnaty } from "./ploshchad-komnaty";
import { ploshchadSten } from "./ploshchad-sten";
import { priced } from "./priced";
import { zatirka } from "./zatirka";

/** Every calc module by tool id. The id is also the URL segment, content filename and analytics value. */
export const toolModules = {
  "ploshchad-komnaty": ploshchadKomnaty,
  "ploshchad-sten": ploshchadSten,
  oboi: priced(oboi, { items: { wallpaper: "pack", "wallpaper-glue": "pack", primer: "pack" }, area: "wallArea" }),
  kraska: priced(kraska, { items: { paint: "unit", primer: "pack" }, area: "area" }),
  plintus: priced(plintus, {
    items: {
      plinth: "pack",
      "plinth-corner-in": "pack",
      "plinth-corner-out": "pack",
      "plinth-cap": "pack",
      "plinth-joiner": "pack",
      "plinth-fastener": "pack",
    },
  }),
  klej: priced(klej, { items: { "tile-adhesive": "pack" }, area: "area" }),
  zatirka: priced(zatirka, { items: { grout: "pack" }, area: "area" }),
  linoleum: priced(linoleum, { items: { linoleum: "unit" }, area: (i) => (i.lengthMm * i.widthMm) / 1_000_000 }),
  laminat: priced(laminat, { items: { laminate: "pack", underlay: "pack" }, area: "floorArea" }),
  plitka: priced(plitka, { items: { tile: "pack", "tile-adhesive": "pack", grout: "pack" }, area: "area" }),
} as const satisfies Record<string, ToolModule>;

export type ToolId = keyof typeof toolModules;
