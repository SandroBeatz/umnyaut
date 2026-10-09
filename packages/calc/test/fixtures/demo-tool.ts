import { z } from "zod";
import { coverage } from "../../src/blocks/coverage";
import { purchase } from "../../src/blocks/packs";
import type { GoldenFile } from "../../src/golden";
import type { ToolModule } from "../../src/types";

/** Test-only paint-like tool: area × rate × layers, sold in buckets. Proves the harness, not a real formula. */
const input = z.object({
  areaM2: z.number().min(0).max(1000),
  ratePerM2: z.number().positive().max(10),
  layers: z.number().int().min(1).max(5),
  bucketL: z.number().positive().max(50),
});
export type DemoInput = z.infer<typeof input>;

export const demoTool: ToolModule<DemoInput> = {
  id: "demo",
  version: 1,
  input,
  defaults: () => ({ areaM2: 20, ratePerM2: 0.12, layers: 2, bucketL: 2.5 }),
  compute(i) {
    const need = coverage({ areaM2: i.areaM2, ratePerM2: i.ratePerM2, layers: i.layers });
    return {
      items: [
        purchase(
          "paint",
          "main",
          { value: need, unit: "l" },
          { kind: "bucket", size: { value: i.bucketL, unit: "l" } },
        ),
      ],
      summary: [{ key: "area", value: i.areaM2, unit: "m2" }],
      warnings: i.areaM2 > 500 ? [{ code: "large_area", level: "warning" }] : [],
      steps: [{ code: "need", values: { area: i.areaM2, need } }],
    };
  },
};

/** 20 m² × 0.12 × 2 = 4.8 l → 2 buckets of 2.5 l; variations over area. */
export const demoGolden: GoldenFile<DemoInput> = {
  tool: "demo",
  examples: Array.from({ length: 10 }, (_, n) => {
    const areaM2 = 10 * (n + 1);
    const need = areaM2 * 0.24;
    return {
      name: `${areaM2} m²`,
      input: { areaM2 },
      expected: {
        items: { paint: { need, packs: Math.ceil(need / 2.5 - 1e-9) } },
        summary: { area: areaM2 },
        warnings: [],
      },
      source: { kind: "manual" as const, ref: `${areaM2} × 0.12 × 2 = ${need} l` },
    };
  }),
  benchmarks: [
    {
      example: "20 m²",
      site: "qalculator",
      url: "https://example.test/paint",
      checkedAt: "2026-10-09",
      observed: { items: { paint: { packs: 2 } } },
    },
  ],
};
