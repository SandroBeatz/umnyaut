import { oboi } from "../tools/oboi";
import { priced } from "../tools/priced";

/** The `oboi` module with prices, alone: a tool page loads only its own calculator. */
export const module = priced(oboi, {
  items: { wallpaper: "pack", "wallpaper-glue": "pack", primer: "pack" },
  area: "wallArea",
});
