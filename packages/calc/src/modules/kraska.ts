import { kraska } from "../tools/kraska";
import { priced } from "../tools/priced";

/** The `kraska` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(kraska, { items: { paint: "unit", primer: "pack" }, area: "area" });
