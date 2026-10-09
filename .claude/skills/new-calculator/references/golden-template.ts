// Shape of packages/calc/src/tools/<id>/golden.ts (types: packages/calc/src/golden.ts).
// At least 10 examples per tool; the shared golden test fails otherwise.
// Every example needs a `source`: datasheet, norm, manual derivation or reviewer. A competitor is never a source:
// its numbers go to `benchmarks`, and any difference from `expected` needs an `explanation`.

import type { GoldenFile } from "../../golden";
import type { LaminatInput } from "./index";

export const golden: GoldenFile<LaminatInput> = {
  tool: "laminat",
  examples: [
    {
      name: "business spec example: 4.6 × 4.3 m, straight, pack 2.22 m²",
      // Merged over defaults(ctx); list only what the scenario sets.
      input: { lengthMm: 4600, widthMm: 4300, packAreaM2: 2.22, method: "straight" },
      expected: {
        // Partial match: only listed fields are compared; packs exactly, other numbers within 1e-6.
        items: { laminate: { packs: 10 } },
        summary: { floorArea: 19.78 },
        warnings: ["narrow_last_row"], // [] = no warnings at all
      },
      source: { kind: "manual", ref: "19,78 м² × 1,10 = 21,76 м² ÷ 2,22 = 9,8 → 10 пачек (business spec §7, mockup)" },
    },
    {
      name: "pack boundary: exact multiple of the pack area",
      input: { lengthMm: 4000, widthMm: 5000, packAreaM2: 2.2, method: "straight" },
      expected: { items: { laminate: { packs: 10 } } },
      source: { kind: "manual", ref: "20 × 1,10 = 22,0 ÷ 2,2 = 10,000… → 10 (ceilPacks tolerance)" },
    },
    // …at least 8 more: small room, large room, openings, each method, +ε above a pack boundary,
    // related items (underlay, plinth), warning cases.
  ],
  benchmarks: [
    {
      example: "business spec example: 4.6 × 4.3 m, straight, pack 2.22 m²",
      site: "qalculator",
      url: "https://qalculator.ru/…",
      checkedAt: "2026-11-01",
      observed: { items: { laminate: { packs: 11 } } },
      explanation: "Qalculator adds 15% waste by default; we use 10% for straight laying (norm laminate.waste.straight)",
    },
  ],
};
