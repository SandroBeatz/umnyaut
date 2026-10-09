import { z } from "zod";
import type { ToolModule } from "../../types";

const input = z.object({});

/** Empty placeholder that proves registry-driven routes (P2.9); the formula arrives in P5.8. */
export const ploshchadKomnaty: ToolModule<z.infer<typeof input>> = {
  id: "ploshchad-komnaty",
  version: 0,
  input,
  defaults: () => ({}),
  compute: () => ({ items: [], summary: [], warnings: [], steps: [] }),
};
