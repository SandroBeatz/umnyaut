import { describe, expect, it } from "vitest";
import { purchase } from "../blocks/packs";
import { costOf } from "./priced";

const roll = purchase("wallpaper", "main", { value: 98, unit: "m" }, { kind: "roll", size: { value: 10, unit: "m" } });
const paint = purchase("paint", "main", { value: 8.5, unit: "l" }, { kind: "can", size: { value: 9, unit: "l" } });

describe("costOf", () => {
  it("per pack or per unit; items without a price are listed as missing", () => {
    // 10 rolls × 1500 + 9 l × 600 = 20 400.
    expect(costOf([roll, paint], { wallpaper: 1500, paint: 600 }, { wallpaper: "pack", paint: "unit" }, 40)).toEqual({
      total: 20_400,
      perM2: 510,
      missing: [],
    });
    expect(costOf([roll, paint], { wallpaper: 1500 }, { wallpaper: "pack", paint: "unit" })).toEqual({
      total: 15_000,
      missing: ["paint"],
    });
  });

  it("no price at all, no cost", () => {
    expect(costOf([roll], {}, { wallpaper: "pack" })).toBeUndefined();
  });
});
