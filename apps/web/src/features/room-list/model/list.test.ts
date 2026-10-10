import { getTool } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { buildList, ownInput } from "./build";
import { migrateList } from "./store";

describe("room list", () => {
  it("drops unknown tools and broken rows; the last entry of a tool wins", () => {
    expect(
      migrateList(
        {
          entries: [
            { tool: "oboi", input: { repeatMm: 640 } },
            { tool: "nope", input: {} },
            { tool: "kraska" },
            { tool: "oboi", input: {} },
          ],
        },
        1,
      ),
    ).toEqual({ entries: [{ tool: "oboi", input: {} }] });
    expect(migrateList(null, 1)).toEqual({ entries: [] });
  });

  it("stores only the tool's own changed fields, not the room", () => {
    const tool = getTool("steny", "oboi");
    if (!tool) throw new Error("no tool");
    const defaults = { lengthMm: 4600, repeatMm: 0, primer: true };
    expect(ownInput(tool, { lengthMm: 5000, repeatMm: 640, primer: true }, defaults)).toEqual({ repeatMm: 640 });
  });

  it("wallpaper on the walls + paint on the ceiling: one primer canister for both, sizes from the room", () => {
    const view = buildList(
      [
        { tool: "oboi", input: {} },
        { tool: "kraska", input: { surface: "ceiling" } },
      ],
      { lengthMm: 4600, widthMm: 4300, heightMm: 2700 },
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
          { tool: "oboi", input: {} },
          { tool: "kraska", input: {} },
        ],
        null,
      ).conflicts,
    ).toEqual(["walls_twice"]);
    expect(
      buildList(
        [
          { tool: "oboi", input: {} },
          { tool: "kraska", input: { surface: "ceiling" } },
        ],
        null,
      ).conflicts,
    ).toEqual([]);
  });

  it("suggests the other purchase tool of the same category", () => {
    const view = buildList([{ tool: "oboi", input: {} }], null);
    expect(view.next.map((t) => t.id)).toEqual(["kraska"]);
  });
});
