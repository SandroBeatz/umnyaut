import { klej } from "../tools/klej";
import { priced } from "../tools/priced";

/** The `klej` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(klej, { items: { "tile-adhesive": "pack" }, area: "area" });
