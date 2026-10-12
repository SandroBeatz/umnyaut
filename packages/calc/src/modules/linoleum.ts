import { linoleum } from "../tools/linoleum";
import { priced } from "../tools/priced";

/** The `linoleum` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(linoleum, { items: { linoleum: "unit", "seam-weld": "pack" }, area: "floorArea" });
