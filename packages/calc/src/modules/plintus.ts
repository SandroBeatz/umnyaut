import { plintus } from "../tools/plintus";
import { priced } from "../tools/priced";

/** The `plintus` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(plintus, {
  items: {
    plinth: "pack",
    "plinth-corner-in": "pack",
    "plinth-corner-out": "pack",
    "plinth-cap": "pack",
    "plinth-joiner": "pack",
    "plinth-fastener": "pack",
  },
});
