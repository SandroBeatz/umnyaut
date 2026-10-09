import { describe, expect, it } from "vitest";
import { wastePct, withWaste } from "./waste";

const rules = [
  { method: "straight", pct: 5 },
  { method: "diagonal", pct: 10, complexShapePct: 3 },
];

describe("waste", () => {
  it("picks the method's % and adds the complex-shape extra", () => {
    expect(wastePct(rules, "straight", "rect")).toBe(5);
    expect(wastePct(rules, "straight", "l")).toBe(5);
    expect(wastePct(rules, "diagonal", "rect")).toBe(10);
    expect(wastePct(rules, "diagonal", "polygon")).toBe(13);
  });

  it("a user override wins; an unknown method gives 0", () => {
    expect(wastePct(rules, "diagonal", "l", 7)).toBe(7);
    expect(wastePct(rules, "herringbone", "rect")).toBe(0);
  });

  it("withWaste adds the %, ignoring negative values", () => {
    expect(withWaste(20, 10)).toBeCloseTo(22, 10);
    expect(withWaste(20, -5)).toBe(20);
  });
});
