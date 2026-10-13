import { describe, expect, it } from "vitest";
import { getToolModule } from "@/entities/tool";
import { buildList } from "./build";

describe("room list", () => {
  it("wallpaper on the walls + paint on the ceiling: one primer canister for both, sizes from the room", () => {
    const view = buildList(
      [
        { id: "c1", tool: "oboi", input: {} },
        { id: "c2", tool: "kraska", input: { surface: "ceiling" } },
      ],
      { lengthMm: 4600, widthMm: 4300, heightMm: 2700 },
      getToolModule,
    );
    expect(view.works.map((w) => w.tool.id)).toEqual(["oboi", "kraska"]);
    const primer = view.items.filter((i) => i.key === "primer");
    // The room has no openings yet, so the tools keep their door and window: walls 44,78 × 0,15 = 6,717
    // + ceiling 19,78 × 0,15 = 2,967 = 9,684 л → one 10 л canister (two if rounded per work).
    expect(primer).toHaveLength(1);
    expect(primer[0]?.need.value).toBeCloseTo(9.684, 9);
    expect(primer[0]?.packs).toBe(1);
    // Ceiling paint 3,956 л is a can set: 2,7 л and 2 × 0,9 л, one line per size.
    expect(view.items.map((i) => i.key)).toEqual(["wallpaper", "wallpaper-glue", "primer", "paint", "paint"]);
    expect(view.next).toEqual([]);
  });

  it("warns when wallpaper and paint both cover the walls", () => {
    expect(
      buildList(
        [
          { id: "x1", tool: "oboi", input: {} },
          { id: "x2", tool: "kraska", input: {} },
        ],
        null,
        getToolModule,
      ).conflicts,
    ).toEqual(["walls_twice"]);
    expect(
      buildList(
        [
          { id: "x3", tool: "oboi", input: {} },
          { id: "x4", tool: "kraska", input: { surface: "ceiling" } },
        ],
        null,
        getToolModule,
      ).conflicts,
    ).toEqual([]);
  });

  it("tile + its own adhesive tool: adhesive counted once, by the adhesive tool", () => {
    const view = buildList(
      [
        { id: "x5", tool: "plitka", input: {} },
        { id: "x6", tool: "klej", input: {} },
      ],
      { lengthMm: 4600, widthMm: 4300 },
      getToolModule,
    );
    // Floor 19,78 m² × 5,4 kg/m² = 106,8 kg → 5 bags (not 9 from summing both works); grout stays from tile.
    expect(view.items.filter((i) => i.key === "tile-adhesive").reduce((n, i) => n + i.packs, 0)).toBe(5);
    expect(view.items.filter((i) => i.key === "grout").reduce((n, i) => n + i.packs, 0)).toBe(3);
  });

  it("after tile, adhesive and grout are not suggested — they are already in the list", () => {
    expect(buildList([{ id: "x7", tool: "plitka", input: {} }], null, getToolModule).next.map((t) => t.id)).toEqual([]);
  });

  it("suggests the other purchase tool of the same category", () => {
    const view = buildList([{ id: "x8", tool: "oboi", input: {} }], null, getToolModule);
    expect(view.next.map((t) => t.id)).toEqual(["kraska"]);
  });
});
