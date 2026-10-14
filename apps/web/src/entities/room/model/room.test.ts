import { describe, expect, it } from "vitest";
import { roomDimensions } from "./format";

describe("roomDimensions", () => {
  // Non-breaking spaces keep the dimensions on one line.
  const nb = (text: string) => text.replace(/ /g, "\u00a0");

  it("formats known parts only", () => {
    expect(roomDimensions({ lengthMm: 4600, widthMm: 4300, heightMm: 2700 }, "м")).toBe(nb("4,6 × 4,3 × 2,7 м"));
    expect(roomDimensions({ lengthMm: 4600, widthMm: 4300 }, "м")).toBe(nb("4,6 × 4,3 м"));
    expect(roomDimensions({ heightMm: 2700 }, "м")).toBeUndefined();
    expect(roomDimensions(null, "м")).toBeUndefined();
  });
});
