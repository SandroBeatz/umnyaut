import { getTool } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { fieldsOf, sizeParts } from "./room";

const tile = getTool("plitka", "plitka");
const paint = getTool("steny", "kraska");

describe("room row of a calculator", () => {
  it("asks for the height only where the tool counts it", () => {
    if (!tile || !paint) throw new Error("no tool");
    expect(sizeParts(tile.fields, { surface: "floor" })).toEqual(["lengthMm", "widthMm"]);
    expect(sizeParts(tile.fields, { surface: "walls" })).toEqual(["lengthMm", "widthMm", "heightMm"]);
    expect(sizeParts(paint.fields, {})).toEqual(["lengthMm", "widthMm", "heightMm"]);
  });

  it("turns a room patch into the tool's input", () => {
    if (!tile) throw new Error("no tool");
    expect(fieldsOf({ lengthMm: 5000, cutCorner: "nw" }, tile.fields)).toEqual({ lengthMm: 5000, cutCorner: "nw" });
  });
});
