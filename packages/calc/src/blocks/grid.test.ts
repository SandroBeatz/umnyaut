import { describe, expect, it } from "vitest";
import { gridArea, gridLine } from "./grid";

describe("gridLine", () => {
  it("from a corner: whole tiles with joints, the rest is one cut", () => {
    // 4600 / 303: 15 tiles take 15 × 303 = 4545 → cut 55.
    expect(gridLine(4600, 300, 3, "corner")).toEqual({ whole: 15, cuts: [55] });
    // 10 tiles and 9 joints fill 3027 exactly.
    expect(gridLine(3027, 300, 3, "corner")).toEqual({ whole: 10, cuts: [] });
  });

  it("from the centre: the parity with the wider edge cut", () => {
    // 4600: 14 tiles → (4600 − 4200 − 45) / 2 = 177,5; 15 tiles → 26 — take 14.
    expect(gridLine(4600, 300, 3, "center")).toEqual({ whole: 14, cuts: [177.5, 177.5] });
    // 4300: 13 tiles → (4300 − 3900 − 42) / 2 = 179; 14 → 27,5.
    expect(gridLine(4300, 300, 3, "center")).toEqual({ whole: 13, cuts: [179, 179] });
    expect(gridLine(3027, 300, 3, "center")).toEqual({ whole: 10, cuts: [] });
  });

  it("from the centre: a remainder no wider than a joint is no cut; a cut is never wider than a tile", () => {
    // 2 × 300 + 3 = 603 leaves 3 mm on 606 — two whole tiles, no cut (was 0 whole and two 301,5 «cuts»).
    expect(gridLine(606, 300, 3, "center")).toEqual({ whole: 2, cuts: [] });
  });

  it("a span shorter than a tile is one cut", () => {
    expect(gridLine(400, 600, 2, "corner")).toEqual({ whole: 0, cuts: [400] });
    expect(gridLine(400, 600, 2, "center")).toEqual({ whole: 0, cuts: [400] });
  });
});

describe("gridArea", () => {
  it("counts whole tiles, edge strips and corners", () => {
    // 15 × 14 whole; strips 15 + 14; corner 1.
    expect(gridArea(4600, 4300, 300, 300, 3, "corner")).toEqual({ whole: 210, cut: 30, narrowestMm: 55 });
    // Centre: 14 × 13 whole; 2 × 13 + 2 × 14 + 4 = 58 cut.
    expect(gridArea(4600, 4300, 300, 300, 3, "center")).toEqual({ whole: 182, cut: 58, narrowestMm: 177.5 });
  });
});
