import { describe, expect, it } from "vitest";
import { oboi } from "../src/tools/oboi";
import { golden } from "../src/tools/oboi/golden";

const ctx = { country: "RU" } as const;
const example = (prefix: string) => {
  const found = golden.examples.find((e) => e.name.startsWith(prefix));
  if (!found) throw new Error(`no golden example «${prefix}»`);
  return oboi.compute(oboi.input.parse({ ...oboi.defaults(ctx), ...found.input }), ctx);
};

describe("oboi steps", () => {
  it("offset match cut by phase: the step shows the split, so the rolls add up (re-review 2026-10-21)", () => {
    // 32 strips: 16 + 16 by phase, 3 of one phase per roll → 6 + 6 = 12, not ⌈32 / 3⌉ = 11.
    const result = example("Offset match 64 cm, height 2.8 m, door and window not placed");
    expect(result.steps.find((s) => s.code === "strip_rolls")).toBeUndefined();
    expect(result.steps.find((s) => s.code === "strip_rolls_phases")?.values).toEqual({
      a: 16,
      b: 16,
      perRoll: 3,
      ra: 6,
      rb: 6,
      rolls: 12,
    });
  });

  it("straight match keeps the single strips-per-roll step", () => {
    const result = oboi.compute(oboi.defaults(ctx), ctx);
    const steps = result.steps.map((s) => s.code);
    expect(steps).not.toContain("strip_rolls_phases");
  });
});
