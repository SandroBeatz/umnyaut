import { describe, expect, it } from "vitest";
import { coverage } from "./coverage";

describe("coverage", () => {
  it("20 m² × 0.12 × 2 layers × 1.15 = 5.52; +10% = 6.072", () => {
    expect(coverage({ areaM2: 20, ratePerM2: 0.12, layers: 2, baseCoef: 1.15 })).toBeCloseTo(5.52, 10);
    expect(coverage({ areaM2: 20, ratePerM2: 0.12, layers: 2, baseCoef: 1.15, wastePct: 10 })).toBeCloseTo(6.072, 10);
  });

  it("defaults to one layer and coefficient 1; zero area → 0", () => {
    expect(coverage({ areaM2: 10, ratePerM2: 4 })).toBe(40);
    expect(coverage({ areaM2: 0, ratePerM2: 4 })).toBe(0);
  });
});
