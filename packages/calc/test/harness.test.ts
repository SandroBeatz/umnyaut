import type fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type GoldenFile, matchExpectation, validateGolden } from "../src/golden";
import { growthViolations, nonFiniteNumbers, resultViolations } from "../src/invariants";
import type { ToolResult } from "../src/types";
import { checkTool } from "./check-tool";
import { type DemoInput, demoGolden, demoTool } from "./fixtures/demo-tool";

const item = (packs: number, need: number, bought: number, leftover = bought - need) => ({
  key: "paint",
  role: "main" as const,
  need: { value: need, unit: "l" as const },
  pack: { kind: "bucket" as const, size: { value: 2.5, unit: "l" as const } },
  packs,
  bought: { value: bought, unit: "l" as const },
  leftover: { value: leftover, unit: "l" as const },
});
const result = (overrides: Partial<ToolResult> = {}): ToolResult => ({
  items: [item(2, 4.8, 5)],
  summary: [{ key: "area", value: 20, unit: "m2" }],
  warnings: [],
  steps: [],
  ...overrides,
});

describe("matchExpectation", () => {
  it("matches listed fields only, packs exactly, the rest within tolerance", () => {
    expect(
      matchExpectation(result(), { items: { paint: { packs: 2, need: 4.8000000001 } }, summary: { area: 20 } }),
    ).toEqual([]);
  });

  it("reports every kind of mismatch", () => {
    const errors = matchExpectation(result({ warnings: [{ code: "x", level: "info" }] }), {
      items: { paint: { packs: 3, bought: 7.5, leftover: 0, need: 1 }, primer: { packs: 1 } },
      absentItems: ["paint"],
      summary: { area: 21, perimeter: 18 },
      warnings: [],
      costTotal: 100,
    });
    expect(errors).toEqual([
      "paint.packs: got 2, expected 3",
      "paint.need: got 4.8, expected 1",
      "paint.bought: got 5, expected 7.5",
      "paint.leftover: got 0.20000000000000018, expected 0",
      "item primer: missing",
      "item paint: expected absent",
      "summary.area: got 20, expected 21",
      "summary.perimeter: missing, expected 18",
      "warnings: expected none, got x",
      "cost.total: missing, expected 100",
    ]);
  });

  it("requires listed warning codes", () => {
    expect(matchExpectation(result(), { warnings: ["large_area"] })).toEqual(["warning large_area: missing"]);
  });
});

describe("validateGolden", () => {
  it("accepts a complete file", () => {
    expect(validateGolden(demoTool, demoGolden)).toEqual([]);
  });

  it("rejects too few, unsourced, duplicate, wrong, throwing and unexplained examples", () => {
    const [first, second] = demoGolden.examples as [(typeof demoGolden.examples)[0], (typeof demoGolden.examples)[0]];
    const bad: GoldenFile<DemoInput> = {
      tool: "other",
      examples: [
        { ...first, source: { kind: "manual", ref: " " } },
        { ...first },
        { ...second, expected: { items: { paint: { packs: 99 } } } },
        { ...second, name: "invalid", input: { areaM2: -1 } },
      ],
      benchmarks: [
        { example: "nope", site: "qalculator", url: "u", checkedAt: "2026-10-09", observed: {} },
        {
          example: first.name,
          site: "qalculator",
          url: "u",
          checkedAt: "2026-10-09",
          observed: { items: { paint: { packs: 5 } } },
        },
        {
          example: first.name,
          site: "qalculator",
          url: "u",
          checkedAt: "2026-10-09",
          observed: { items: { paint: { packs: 5 } } },
          explanation: "They add 10% waste",
        },
      ],
    };
    const errors = validateGolden(demoTool, bad);
    expect(errors).toEqual([
      'golden file is for "other", not "demo"',
      "4 examples, need at least 10",
      `"${first.name}": missing source`,
      `"${first.name}": duplicate name`,
      `"${second.name}": paint.packs: got 2, expected 99`,
      expect.stringMatching(/^"invalid": threw/),
      'benchmark qalculator "nope": no such example',
      `benchmark qalculator "${first.name}": differs from our result without an explanation`,
    ]);
  });
});

describe("invariants", () => {
  it("finds non-finite numbers deep in a result", () => {
    expect(nonFiniteNumbers({ a: [1, Number.NaN], b: { c: Number.POSITIVE_INFINITY }, d: "x" })).toEqual([
      "result.a[1]",
      "result.b.c",
    ]);
  });

  it("flags fractional packs, bought < need and negative leftover", () => {
    expect(resultViolations(result({ items: [item(1.5, 4.8, 3.75, -1.05)] }))).toEqual([
      "paint: packs 1.5 is not a whole number",
      "paint: bought 3.75 < need 4.8",
      "paint: negative leftover -1.05",
    ]);
    expect(resultViolations(result())).toEqual([]);
  });

  it("flags less bought or a vanished item when the area grows", () => {
    expect(growthViolations(result(), result({ items: [item(1, 2, 2.5)] }))).toEqual([
      "paint: bought 5 → 2.5 when the area grew",
    ]);
    expect(growthViolations(result(), result({ items: [] }))).toEqual(["paint: disappeared when the area grew"]);
    expect(growthViolations(result(), result({ items: [item(3, 7, 7.5)] }))).toEqual([]);
    // A can set may swap sizes: 2 × 2,5 л → 1 × 9 л is still more paint.
    const big = { ...item(1, 6, 9), pack: { kind: "bucket" as const, size: { value: 9, unit: "l" as const } } };
    expect(growthViolations(result(), result({ items: [big] }))).toEqual([]);
  });

  it("the property runner holds for the demo tool", () => {
    checkTool(demoTool, {
      input: (f: typeof fc) =>
        f.record({ areaM2: f.double({ min: 0, max: 500, noNaN: true }), layers: f.integer({ min: 1, max: 5 }) }),
      grow: (i: DemoInput) => ({ ...i, areaM2: i.areaM2 * 1.5 + 1 }),
    });
  });
});
