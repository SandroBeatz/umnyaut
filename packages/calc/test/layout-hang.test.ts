import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { hangStrips } from "../src/blocks/hang";
import { oboi } from "../src/tools/oboi";

const ctx = { country: "RU" } as const;
const defaults = oboi.defaults(ctx);
const summary = (r: ReturnType<typeof oboi.compute>, key: string) => r.summary.find((s) => s.key === key)?.value;

describe("hangStrips", () => {
  it("covers every wall from corner to corner without gaps; rests stay narrower than a strip", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 300, max: 8000 }), { minLength: 4, maxLength: 4 }),
        fc.integer({ min: 300, max: 1500 }),
        (lengths, rollWidthMm) => {
          const hang = hangStrips({
            walls: lengths.map((lengthMm) => ({ lengthMm, openings: [] })),
            heightMm: 2700,
            rollWidthMm,
            wrapMm: 15,
            minCarryMm: 50,
            minPieceMm: 50,
            trimMm: 100,
            windowMarginMm: 20,
          });
          return hang.walls.every((wall, j) => {
            const L = lengths[j] ?? 0;
            const end = j === lengths.length - 1 ? L - 15 : L;
            let at = 0;
            for (const c of wall.columns) {
              if (Math.abs(c.x - at) > 1e-6 || c.w <= 0 || c.w > rollWidthMm + 1e-6) return false;
              at = c.x + c.w;
            }
            return at >= Math.min(end, L) - 1e-6 && at <= L + 1e-6;
          });
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe("wallpaper scheme", () => {
  it("example room: the scheme's strips and pieces are the purchase, the roll map cuts each once", () => {
    const result = oboi.compute(defaults, ctx);
    const layout = result.layout;
    if (!layout?.elevations || !layout.rolls) throw new Error("no wallpaper layout");
    expect(layout.kind).toBe("strips");
    expect(layout.stats.whole + layout.stats.cut).toBe(summary(result, "strips"));
    expect(layout.rolls).toHaveLength(11);
    const strips = layout.rolls.flatMap((r) => r.cuts.flatMap((c) => (c.strip === undefined ? [] : [c.strip])));
    // Only full-height strips are numbered: 1…32, each cut once.
    expect([...strips].sort((a, b) => a - b)).toEqual(Array.from({ length: 32 }, (_, k) => k + 1));
    expect(layout.rolls.flatMap((r) => r.cuts.filter((c) => c.where))).toHaveLength(summary(result, "pieces") ?? -1);
    // Start at the window wall (wall 4), first level line 51,5 cm from its corner.
    expect(layout.guide[0]).toEqual({ code: "start_window", values: { wall: 4, plumb: 51.5 } });
    expect(layout.elevations[3]?.strips).toMatchObject({ first: 1, last: 7, cornerMm: 75, carryOutMm: 440 });
    expect(layout.elevations[3]?.strips?.pieces.map((p) => `К${p.n} ${p.where}`)).toEqual([
      "К1 above",
      "К1 below",
      "К2 above",
      "К2 below",
    ]);
    expect(layout.elevations[0]?.strips).toMatchObject({ carryFrom: 7, carryInMm: 440, first: 8, last: 15 });
  });

  it("openings not placed: the perimeter estimate, empty walls, the guide asks to place them", () => {
    const openings = defaults.openings.map(({ places, ...o }) => o);
    const result = oboi.compute({ ...defaults, openings }, ctx);
    expect(result.steps.map((s) => s.code)).toContain("strips");
    expect(result.layout?.elevations?.every((e) => e.pieces.length === 0)).toBe(true);
    expect(result.layout?.guide.map((s) => s.code)).toEqual(["place_openings"]);
  });

  it("any placed room: strips on the scheme = strips bought, every strip and piece cut from a roll once", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1500, max: 8000 }),
        fc.integer({ min: 1500, max: 8000 }),
        fc.integer({ min: 2200, max: 3200 }),
        fc.constantFrom(530, 700, 1060),
        fc.constantFrom(0, 320, 640),
        fc.constantFrom("straight", "offset" as const),
        fc.uniqueArray(
          fc.record({
            type: fc.constantFrom("door" as const, "window" as const),
            widthMm: fc.integer({ min: 600, max: 2000 }),
            heightMm: fc.integer({ min: 600, max: 2100 }),
            wall: fc.constantFrom(0, 1, 2, 3),
            offset: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          { maxLength: 4, selector: (o) => o.wall },
        ),
        (lengthMm, widthMm, heightMm, rollWidthMm, repeatMm, match, list) => {
          const wallLength = (w: number) => (w % 2 === 0 ? lengthMm : widthMm);
          const openings = list.map((o) => ({
            type: o.type,
            widthMm: Math.min(o.widthMm, wallLength(o.wall)),
            heightMm: o.heightMm,
            count: 1,
            places: [{ wall: o.wall, offsetMm: Math.floor(o.offset * Math.max(wallLength(o.wall) - o.widthMm, 0)) }],
          }));
          const result = oboi.compute(
            { ...defaults, lengthMm, widthMm, heightMm, rollWidthMm, repeatMm, match, openings },
            ctx,
          );
          const layout = result.layout;
          const rolls = result.items.find((it) => it.key === "wallpaper")?.packs ?? 0;
          if (!layout?.rolls) return result.items.length === 0 || !result.items.some((it) => it.key === "wallpaper");
          const strips = layout.rolls.flatMap((r) => r.cuts.flatMap((c) => (c.strip === undefined ? [] : [c.strip])));
          return (
            layout.stats.whole + layout.stats.cut === summary(result, "strips") &&
            new Set(strips).size === strips.length &&
            strips.length === summary(result, "strips") &&
            Math.max(0, ...strips) === summary(result, "strips") &&
            layout.rolls.flatMap((r) => r.cuts.filter((c) => c.where)).length === summary(result, "pieces") &&
            layout.rolls.length === rolls
          );
        },
      ),
      { numRuns: 300 },
    );
  });
});
