import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Layers are created up front and filled from Phase 3 on.
    ignores: ["**/.gitkeep"],
  },
  {
    // Steiger does not know our `views` layer (FSD `pages`, renamed for Next.js) or the route files in
    // apps/web/app, so slices used from there look unused or used once. Reuse is reviewed by hand instead.
    rules: { "fsd/insignificant-slice": "off" },
  },
]);
