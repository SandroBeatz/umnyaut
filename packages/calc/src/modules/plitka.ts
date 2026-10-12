import { plitka } from "../tools/plitka";
import { priced } from "../tools/priced";

/** The `plitka` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(plitka, { items: { tile: "pack", "tile-adhesive": "pack", grout: "pack" }, area: "area" });
