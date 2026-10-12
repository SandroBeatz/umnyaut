import { laminat } from "../tools/laminat";
import { priced } from "../tools/priced";

/** The `laminat` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(laminat, { items: { laminate: "pack", underlay: "pack" }, area: "floorArea" });
