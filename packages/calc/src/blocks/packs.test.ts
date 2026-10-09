import { describe, expect, it } from "vitest";
import { bestPackSet, ceilPacks, purchase } from "./packs";

describe("ceilPacks", () => {
  it("rounds up", () => {
    expect(ceilPacks(22.21, 2.22)).toBe(11);
    expect(ceilPacks(0.01, 25)).toBe(1);
  });

  it("an exact multiple stays exact despite float noise", () => {
    expect(ceilPacks(22.2, 2.22)).toBe(10);
    expect(ceilPacks(0.1 * 3, 0.1)).toBe(3);
    expect(ceilPacks(2.22 * 7, 2.22)).toBe(7);
  });

  it("a real excess above the tolerance adds a pack", () => {
    expect(ceilPacks(10.0000001, 1)).toBe(11);
  });

  it("a tiny but real need buys one pack (found by fast-check)", () => {
    expect(ceilPacks(1e-9, 2.5)).toBe(1);
    expect(ceilPacks(5e-324, 2.5)).toBe(1);
  });

  it("nothing to buy for zero, negative or invalid input", () => {
    expect(ceilPacks(0, 2)).toBe(0);
    expect(ceilPacks(-1, 2)).toBe(0);
    expect(ceilPacks(5, 0)).toBe(0);
    expect(ceilPacks(Number.NaN, 2)).toBe(0);
  });
});

describe("purchase", () => {
  it("21.3 m² in 2.22 m² packs: 10 packs, 22.2 bought, 0.9 left over", () => {
    const item = purchase(
      "laminate",
      "main",
      { value: 21.3, unit: "m2" },
      { kind: "pack", size: { value: 2.22, unit: "m2" } },
    );
    expect(item.packs).toBe(10);
    expect(item.bought.value).toBeCloseTo(22.2, 10);
    expect(item.leftover.value).toBeCloseTo(0.9, 10);
    expect(item.bought.unit).toBe("m2");
  });

  it("passes the shop query and next tool through", () => {
    const item = purchase(
      "underlay",
      "related",
      { value: 1, unit: "m2" },
      { kind: "roll", size: { value: 10, unit: "m2" } },
      { nextTool: "podlozhka" },
    );
    expect(item).toMatchObject({ packs: 1, nextTool: "podlozhka", role: "related" });
  });
});

describe("bestPackSet", () => {
  const cans = [{ size: 0.9 }, { size: 2.7 }, { size: 9 }];

  it("10 l from 0.9 / 2.7 / 9 l: 10.8 l as 9 + 0.9 + 0.9 (fewest cans among equal overpay)", () => {
    expect(bestPackSet(10, cans)).toEqual({ counts: [2, 0, 1], total: expect.closeTo(10.8, 10) });
  });

  it("an exact can size is bought as is", () => {
    expect(bestPackSet(2.7, cans).counts).toEqual([0, 1, 0]);
  });

  it("equal amount → fewer packs: 2 l is one 2.7 l can, not three 0.9 l", () => {
    expect(bestPackSet(2, cans).counts).toEqual([0, 1, 0]);
  });

  it("with prices the cheapest set wins: three 0.9 l at 300 beat one 2.7 l at 1200", () => {
    const priced = [
      { size: 0.9, price: 300 },
      { size: 2.7, price: 1200 },
    ];
    expect(bestPackSet(2, priced)).toEqual({ counts: [3, 0], total: expect.closeTo(2.7, 10), price: 900 });
  });

  it("nothing to buy, or no usable sizes", () => {
    expect(bestPackSet(0, cans)).toEqual({ counts: [0, 0, 0], total: 0 });
    expect(bestPackSet(5, [{ size: 0 }])).toEqual({ counts: [0], total: 0 });
  });

  it("huge amounts fall back to the largest pack", () => {
    expect(bestPackSet(2_000_000, [{ size: 1 }, { size: 3 }]).counts).toEqual([0, 666_667]);
  });
});
