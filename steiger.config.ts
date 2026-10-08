import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Layers are created up front and filled from Phase 3 on.
    ignores: ["**/.gitkeep"],
  },
]);
