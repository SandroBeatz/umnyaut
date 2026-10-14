import { describe, expect, it } from "vitest";
import { centred, collapse, expand } from "./plan";

describe("plan openings", () => {
  const openings = [
    { type: "window" as const, widthMm: 1200, heightMm: 1400, count: 2, places: [{ wall: 0, offsetMm: 300 }] },
    { type: "door" as const, widthMm: 800, heightMm: 2000, count: 0 },
  ];

  it("expands counts into single openings and keeps the marked places", () => {
    const list = expand(openings);
    expect(list).toHaveLength(2);
    expect(list[0]?.place).toEqual({ wall: 0, offsetMm: 300 });
    expect(list[1]?.place).toBeUndefined();
  });

  it("collapses back to one opening per door or window with the same total", () => {
    const back = collapse(expand(openings));
    expect(back).toEqual([
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 0, offsetMm: 300 }] },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
    ]);
  });

  it("puts a new opening in the middle of wall 1", () => {
    const room = { lengthMm: 4000, widthMm: 3000, cutCorner: "se" as const };
    expect(centred(room, { type: "door", widthMm: 800, heightMm: 2000 }).place).toEqual({ wall: 0, offsetMm: 1600 });
  });
});
