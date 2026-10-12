import { priced } from "../tools/priced";
import { zatirka } from "../tools/zatirka";

/** The `zatirka` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(zatirka, { items: { grout: "pack" }, area: "area" });
