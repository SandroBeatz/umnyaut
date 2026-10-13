import type { EstimateCalc } from "@umnyaut/calc";
import { getTool, tools } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { chipLabel, nextSurface, overlapOf, ownInput, partsLabel, surfaceInput, surfaceOf } from "./calcs";

const tool = (category: string, id: string) => {
  const found = getTool(category, id);
  if (!found) throw new Error(id);
  return found;
};
const tile = tool("plitka", "plitka");
const paint = tool("steny", "kraska");
const wallpaper = tool("steny", "oboi");
const calc = (id: string, toolId: string, extra: Partial<EstimateCalc> = {}): EstimateCalc => ({
  id,
  roomId: "r1",
  tool: toolId,
  toolVersion: 1,
  input: {},
  openedAt: 0,
  ...extra,
});

describe("calcs of a tool in a room", () => {
  it("keeps only the tool's own changed fields, not the room", () => {
    const defaults = { lengthMm: 4600, repeatMm: 0, primer: true };
    expect(ownInput(wallpaper, { lengthMm: 5000, repeatMm: 640, primer: true }, defaults)).toEqual({ repeatMm: 640 });
  });

  it("reads the surface from the tool's field or its fixed one, and back", () => {
    expect(surfaceOf(tile, { surface: "walls" })).toBe("walls");
    expect(surfaceOf(paint, { surface: "both" })).toBe("walls-ceiling");
    expect(surfaceOf(wallpaper, {})).toBe("walls");
    expect(surfaceOf(tool("pol", "plintus"), {})).toBeUndefined();
    expect(surfaceInput(paint, "ceiling")).toEqual({ surface: "ceiling" });
    expect(surfaceInput(wallpaper, "walls")).toEqual({});
  });

  it("names chips by surface and label, else «Расчёт N»", () => {
    expect(chipLabel(tile, calc("c1", "plitka", { surface: "walls", label: "белая" }), 0)).toBe("Стены · белая");
    expect(chipLabel(paint, calc("c1", "kraska", { surface: "walls-ceiling" }), 0)).toBe("Стены и потолок");
    expect(chipLabel(tool("pol", "laminat"), calc("c2", "laminat", { surface: "floor" }), 1)).toBe("Расчёт 2");
  });

  it("«+ Ещё» takes the first surface no calc covers", () => {
    expect(nextSurface(tile, [calc("c1", "plitka", { surface: "floor" })])).toEqual({ surface: "walls" });
    expect(nextSurface(paint, [calc("c1", "kraska", { surface: "walls" })])).toEqual({ surface: "ceiling" });
    expect(
      nextSurface(tile, [calc("c1", "plitka", { surface: "floor" }), calc("c2", "plitka", { surface: "walls" })]),
    ).toEqual({
      surface: "floor",
    });
  });

  it("finds a finish on the same surface; a calc over two surfaces can be split", () => {
    const both = calc("c1", "kraska", { surface: "walls-ceiling" });
    const walls = calc("c2", "kraska", { surface: "walls" });
    expect(overlapOf(walls, [both, walls], tools)).toEqual({
      parts: ["walls"],
      calc: "Краска: Стены и потолок",
      split: { id: "c1", surfaces: ["walls", "ceiling"] },
    });
    const paper = calc("c3", "oboi", { surface: "walls" });
    expect(overlapOf(paper, [both, paper], tools)).toEqual({ parts: ["walls"], calc: "Краска: Стены и потолок" });
    // Adhesive is a consumable, not a finish: no overlap with tile on the same floor.
    const floor = calc("c4", "plitka", { surface: "floor" });
    expect(overlapOf(floor, [floor, calc("c5", "klej", { surface: "floor" })], tools)).toBeUndefined();
    // Tile on the walls too: the paint split still comes first.
    const tiled = calc("c6", "plitka", { surface: "walls" });
    expect(overlapOf(walls, [tiled, both, walls], tools)?.split).toEqual({ id: "c1", surfaces: ["walls", "ceiling"] });
    expect(partsLabel(["floor", "walls"])).toBe("Пол и стены");
  });
});
