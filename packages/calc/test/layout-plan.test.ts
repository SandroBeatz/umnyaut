import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ploshchadKomnaty } from "../src/tools/ploshchad-komnaty";
import { ploshchadSten } from "../src/tools/ploshchad-sten";

const ctx = { country: "RU" } as const;
const room = ploshchadKomnaty.defaults(ctx);
const walls = ploshchadSten.defaults(ctx);
const door = { type: "door", widthMm: 800, heightMm: 2000, count: 1 } as const;
const window = { type: "window", widthMm: 1200, heightMm: 1400, count: 1 } as const;

describe("room plan (room area, wall area)", () => {
  it("room area: the rectangle with four walls and no openings asks to add them", () => {
    const layout = ploshchadKomnaty.compute(room, ctx).layout;
    expect(layout?.kind).toBe("plan");
    expect(layout?.outline).toEqual([
      [0, 0],
      [4600, 0],
      [4600, 4300],
      [0, 4300],
    ]);
    expect(layout?.walls.map((w) => w.lengthMm)).toEqual([4600, 4300, 4600, 4300]);
    expect(layout?.pieces).toEqual([]);
    expect(layout?.guide.map((s) => s.code)).toEqual(["add_openings"]);
  });

  it("room area: an L-shape draws its cut-out in the chosen corner, six walls", () => {
    const layout = ploshchadKomnaty.compute({ ...room, shape: "l", cutCorner: "nw" }, ctx).layout;
    expect(layout?.walls).toHaveLength(6);
    // The 1.5 × 1.2 m cut-out sits top left: no point of the contour inside it.
    expect(layout?.outline).not.toContainEqual([0, 0]);
    expect(layout?.outline).toContainEqual([1500, 1200]);
    expect(layout?.widthMm).toBe(4600);
    expect(layout?.heightMm).toBe(4300);
  });

  it("room area: a cut-out as big as the room is drawn as the rectangle it is counted as", () => {
    const result = ploshchadKomnaty.compute({ ...room, shape: "l", cutLengthMm: 4600 }, ctx);
    expect(result.warnings.map((w) => w.code)).toContain("cut_too_large");
    expect(result.layout?.walls).toHaveLength(4);
  });

  it("wall area: placed openings are drawn on their walls, the unplaced ones are asked for", () => {
    const placed = { ...door, places: [{ wall: 2, offsetMm: 300 }] };
    const layout = ploshchadSten.compute({ ...walls, openings: [placed, window] }, ctx).layout;
    expect(layout?.marks).toEqual([{ kind: "door", wall: 2, x1: 4300, y1: 4300, x2: 3500, y2: 4300 }]);
    expect(layout?.guide).toEqual([{ code: "place_openings", values: { count: 1 } }]);
  });

  it("wall area: every opening placed — no request; one off its wall warns", () => {
    const openings = [
      { ...door, places: [{ wall: 0, offsetMm: 100 }] },
      { ...window, places: [{ wall: 1, offsetMm: 4000 }] },
    ];
    const result = ploshchadSten.compute({ ...walls, openings }, ctx);
    expect(result.layout?.guide).toEqual([]);
    expect(result.layout?.marks).toHaveLength(2);
    expect(result.warnings).toContainEqual({ code: "opening_off_wall", level: "warning", values: { count: 1 } });
  });

  it("wall area: an L-shaped room keeps the places made on its six walls", () => {
    const openings = [
      { ...door, places: [{ wall: 4, offsetMm: 600 }] },
      { ...window, places: [{ wall: 5, offsetMm: 1500 }] },
    ];
    const result = ploshchadSten.compute({ ...walls, shape: "l", cutCorner: "ne", openings }, ctx);
    expect(result.layout?.walls).toHaveLength(6);
    expect(result.layout?.marks.map((m) => [m.kind, m.wall])).toEqual([
      ["door", 4],
      ["window", 5],
    ]);
    expect(result.layout?.guide).toEqual([]);
    expect(result.warnings.map((w) => w.code)).not.toContain("opening_off_wall");
  });

  it("places never change a number, any shape, corner or wall (off the room too)", () => {
    const numbers = (r: { summary: unknown; steps: unknown }) => ({ summary: r.summary, steps: r.steps });
    fc.assert(
      fc.property(
        fc.constantFrom("rect" as const, "l" as const),
        fc.constantFrom("ne" as const, "se" as const, "sw" as const, "nw" as const),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 0, max: 30_000 }),
        (shape, cutCorner, wall, offsetMm) => {
          const openings = [{ ...door, places: [{ wall, offsetMm }] }, window];
          const sten = { ...walls, shape, cutCorner };
          const bare = numbers(ploshchadSten.compute({ ...sten, openings: [door, window] }, ctx));
          expect(numbers(ploshchadSten.compute({ ...sten, openings }, ctx))).toEqual(bare);
          const komnaty = { ...room, shape, cutCorner };
          const floor = numbers(ploshchadKomnaty.compute(komnaty, ctx));
          expect(numbers(ploshchadKomnaty.compute({ ...komnaty, openings }, ctx))).toEqual(floor);
        },
      ),
      { numRuns: 200 },
    );
  });
});
