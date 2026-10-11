import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { linoleum } from "../src/tools/linoleum";

const ctx = { country: "RU" } as const;
const defaults = linoleum.defaults(ctx);
const summary = (r: ReturnType<typeof linoleum.compute>, key: string) => r.summary.find((s) => s.key === key)?.value;

describe("linoleum scheme", () => {
  it("example room: two sheets of 2.5 m with the seam between them, the guide uses the door and window", () => {
    const result = linoleum.compute(defaults, ctx);
    const layout = result.layout;
    if (!layout) throw new Error("no layout");
    expect(layout.kind).toBe("strips");
    expect(layout.sheets?.map((s) => [s.lengthMm, s.floorWidthMm])).toEqual([
      [4300, 2475],
      [4300, 2125],
    ]);
    expect(layout.stats).toMatchObject({ whole: 1, cut: 1, reused: 0 });
    expect(layout.marks.map((m) => m.kind)).toEqual(["start", "seam", "door", "window"]);
    // Window in the left wall: light runs along the length, the 2.5 m sheets run across it.
    expect(layout.guide.map((s) => s.code)).toEqual(["start", "relax", "seam_overlap", "weld", "trim", "light_across"]);
    expect(layout.guide.at(-1)?.values).toEqual({ width: 2.5, seams: 1, area: 23 });
  });

  it("the sheets in the scheme are the sheets bought, whatever the room, width, allowance, repeat and L-cut", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 12_000 }),
        fc.integer({ min: 1000, max: 12_000 }),
        fc.constantFrom(0, 1500, 2000, 2500, 3000, 3500, 4000),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 600 }),
        fc.boolean(),
        fc.constantFrom("ne", "se", "sw", "nw" as const),
        (lengthMm, widthMm, rollWidthMm, overlapMm, allowanceMm, repeatMm, l, cutCorner) => {
          const input = {
            ...defaults,
            lengthMm,
            widthMm,
            rollWidthMm,
            overlapMm,
            allowanceMm,
            repeatMm,
            shape: l ? ("l" as const) : ("rect" as const),
            cutLengthMm: Math.round(lengthMm / 3),
            cutWidthMm: Math.round(widthMm / 3),
            cutCorner,
          };
          const result = linoleum.compute(input, ctx);
          const layout = result.layout;
          if (!layout?.sheets) return false;
          const cutM = layout.sheets.reduce((sum, s) => sum + s.lengthMm, 0) / 1000;
          const bought = summary(result, "length") ?? 0;
          const seams = layout.marks.filter((m) => m.kind === "seam").length;
          const inside = layout.pieces.every(
            (p) => p.x >= -1e-6 && p.y >= -1e-6 && p.x + p.w <= lengthMm + 1e-6 && p.y + p.h <= widthMm + 1e-6,
          );
          return (
            layout.sheets.length === summary(result, "sheets") &&
            cutM <= bought + 1e-9 &&
            bought - cutM < input.cutStepMm / 1000 &&
            seams <= (summary(result, "seams") ?? 0) &&
            inside
          );
        },
      ),
      { numRuns: 300 },
    );
  });

  it("a seam in the doorway moves the sheets to start from the other wall; the purchase stays", () => {
    // 2.5 m sheets across a 4.6 m length: the seam at 2475 mm from the left wall, 2125 mm from the right one.
    const door = {
      type: "door",
      widthMm: 800,
      heightMm: 2000,
      count: 1,
      places: [{ wall: 0, offsetMm: 2200 }],
    } as const;
    const plain = linoleum.compute({ ...defaults, openings: [] }, ctx);
    const result = linoleum.compute({ ...defaults, openings: [door] }, ctx);
    expect(result.items).toEqual(plain.items);
    expect(result.layout?.guide.map((s) => s.code)).toContain("door_clear");
    const seam = result.layout?.marks.find((m) => m.kind === "seam");
    expect(seam?.x1).toBe(2125);
  });

  it("a seam that cannot leave the doorway is reported", () => {
    // Door 2 m wide in the middle of the top wall covers the seam either way.
    const door = {
      type: "door",
      widthMm: 2000,
      heightMm: 2000,
      count: 1,
      places: [{ wall: 0, offsetMm: 1300 }],
    } as const;
    const result = linoleum.compute({ ...defaults, openings: [door] }, ctx);
    expect(result.layout?.guide.map((s) => s.code)).toContain("seam_door");
  });

  it("window in the top wall: seams run along the light", () => {
    const window = {
      type: "window",
      widthMm: 1200,
      heightMm: 1400,
      count: 1,
      places: [{ wall: 0, offsetMm: 1700 }],
    } as const;
    const result = linoleum.compute({ ...defaults, openings: [window] }, ctx);
    expect(result.layout?.guide.map((s) => s.code)).toContain("light_along");
  });

  it("one sheet: no seams, no seam advice", () => {
    const result = linoleum.compute({ ...defaults, lengthMm: 3000, widthMm: 2500 }, ctx);
    expect(result.layout?.marks.filter((m) => m.kind === "seam")).toEqual([]);
    expect(result.layout?.guide.map((s) => s.code)).toEqual(["start", "relax", "trim"]);
  });

  it("L-shape: short sheets are cut shorter and drawn only where the floor is", () => {
    // Sheets along the length (2 m roll): the third lies wholly in the 1.6 m band of the cut-out.
    const input = {
      ...defaults,
      shape: "l" as const,
      lengthMm: 6000,
      widthMm: 5200,
      cutLengthMm: 2000,
      cutWidthMm: 1600,
      rollWidthMm: 2000,
      cutCorner: "se" as const,
    };
    const layout = linoleum.compute(input, ctx).layout;
    const short = layout?.sheets?.filter((s) => s.short) ?? [];
    expect(short.length).toBeGreaterThan(0);
    expect(layout?.guide.map((s) => s.code)).toContain("short");
    // Short sheets stop at the cut-out; a sheet crossing into the narrow part is hatched (clipped on the plan).
    for (const p of layout?.pieces ?? []) {
      if (p.x + p.w > 4000 && p.y + p.h > 3600) expect(p.cut).toBe(true);
      expect(p.x >= 4000 && p.y >= 3600).toBe(false);
    }
  });
});
