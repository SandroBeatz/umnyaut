import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { gridLine } from "../src/blocks/grid";
import { gridCells } from "../src/blocks/layout-grid";
import { plitka } from "../src/tools/plitka";

const ctx = { country: "RU" } as const;
const defaults = plitka.defaults(ctx);
const summary = (r: ReturnType<typeof plitka.compute>, key: string) => r.summary.find((s) => s.key === key)?.value;

describe("gridCells", () => {
  it("the cells are gridLine's tiles and cuts, in order, joints between them, inside the span", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10_000 }),
        fc.integer({ min: 50, max: 1200 }),
        fc.integer({ min: 0, max: 10 }),
        fc.constantFrom("corner", "center" as const),
        (span, tile, joint, start) => {
          const line = gridLine(span, tile, joint, start);
          const cells = gridCells(span, tile, joint, start);
          const whole = cells.filter((c) => !c.cut).length;
          const cuts = cells.filter((c) => c.cut).map((c) => c.size);
          const ordered = cells.every((c, k) => k === 0 || c.at >= (cells[k - 1]?.at ?? 0) + (cells[k - 1]?.size ?? 0));
          const last = cells.at(-1);
          return (
            whole === line.whole &&
            JSON.stringify(cuts) === JSON.stringify(line.cuts) &&
            ordered &&
            (cells[0]?.at ?? 0) === 0 &&
            (last ? last.at + last.size <= span + 1e-6 : true)
          );
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe("tile floor scheme", () => {
  it("example room: from the door's corner, whole and cut tiles as counted, cut widths at the far walls", () => {
    const result = plitka.compute(defaults, ctx);
    const layout = result.layout;
    if (!layout) throw new Error("no layout");
    expect(layout.kind).toBe("grid");
    expect(layout.stats.whole).toBe(summary(result, "whole"));
    expect(layout.stats.cut).toBe(summary(result, "cut"));
    // Door in the bottom wall: the whole tiles start at the bottom-left corner.
    expect(layout.marks[0]).toMatchObject({ kind: "start", x1: 0, y1: 4300 });
    expect(layout.guide.map((s) => s.code)).toEqual([
      "start_corner",
      "start_door",
      "cut_wall",
      "cut_wall",
      "try_center",
      "joint",
    ]);
    expect(layout.guide[0]?.values).toEqual({ a: 3, b: 4 });
  });

  it("rectangle: the scheme's whole and cut tiles are the counted ones, whatever the room, tile and start", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 600, max: 9000 }),
        fc.integer({ min: 600, max: 9000 }),
        fc.integer({ min: 100, max: 1200 }),
        fc.integer({ min: 100, max: 1200 }),
        fc.integer({ min: 0, max: 5 }),
        fc.constantFrom("corner", "center" as const),
        fc.constantFrom(0, 1, 2, 3),
        (lengthMm, widthMm, tileLengthMm, tileWidthMm, jointMm, start, wall) => {
          const door = {
            type: "door" as const,
            widthMm: 400,
            heightMm: 2000,
            count: 1,
            places: [{ wall, offsetMm: 50 }],
          };
          const result = plitka.compute(
            { ...defaults, lengthMm, widthMm, tileLengthMm, tileWidthMm, jointMm, start, openings: [door] },
            ctx,
          );
          const layout = result.layout;
          if (!layout) return false;
          const inside = layout.pieces.every(
            (p) => p.x >= -1e-6 && p.y >= -1e-6 && p.x + p.w <= lengthMm + 1e-6 && p.y + p.h <= widthMm + 1e-6,
          );
          return (
            layout.stats.whole === summary(result, "whole") && layout.stats.cut === summary(result, "cut") && inside
          );
        },
      ),
      { numRuns: 300 },
    );
  });

  it("L-shape: never more tiles on the scheme than counted, and the start corner is a corner of the room", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 9000 }),
        fc.integer({ min: 2000, max: 9000 }),
        fc.constantFrom("ne", "se", "sw", "nw" as const),
        fc.constantFrom(0, 1, 2, 3),
        fc.constantFrom("corner", "center" as const),
        (lengthMm, widthMm, cutCorner, wall, start) => {
          const door = {
            type: "door" as const,
            widthMm: 400,
            heightMm: 2000,
            count: 1,
            places: [{ wall, offsetMm: 50 }],
          };
          const input = {
            ...defaults,
            shape: "l" as const,
            lengthMm,
            widthMm,
            cutLengthMm: Math.round(lengthMm / 3),
            cutWidthMm: Math.round(widthMm / 3),
            cutCorner,
            start,
            openings: [door],
          };
          const result = plitka.compute(input, ctx);
          const layout = result.layout;
          if (!layout) return false;
          const counted = (summary(result, "whole") ?? 0) + (summary(result, "cut") ?? 0);
          const startMark = layout.marks.find((m) => m.kind === "start");
          const onOutline = startMark
            ? layout.outline.some(([x, y]) => x === startMark.x1 && y === startMark.y1)
            : start === "center";
          return layout.pieces.length <= counted && onOutline;
        },
      ),
      { numRuns: 300 },
    );
  });

  it("a door only in the cut-out's walls: no promise of a whole tile at it", () => {
    // L with the cut-out bottom right: wall 3 (index 2) is the cut-out's bottom edge at y = 3100.
    const door = {
      type: "door",
      widthMm: 800,
      heightMm: 2000,
      count: 1,
      places: [{ wall: 2, offsetMm: 300 }],
    } as const;
    const layout = plitka.compute({ ...defaults, shape: "l", openings: [door] }, ctx).layout;
    const codes = layout?.guide.map((s) => s.code) ?? [];
    expect(codes).not.toContain("start_door");
    expect(codes).not.toContain("place_door");
  });

  it("a cut under a quarter of a long tile's side suggests the centre start", () => {
    const result = plitka.compute({ ...defaults, tileLengthMm: 600, tileWidthMm: 300, lengthMm: 4320, widthMm: 4340 }, ctx);
    // Along the length: 7 × 603 = 4221, cut 99 mm < 600 / 4 (wider than a quarter of 300); across: 98 mm ≥ 300 / 4.
    expect(result.layout?.guide.map((s) => s.code)).toContain("try_center");
  });

  it("from the centre: axes instead of a start corner, equal cuts at opposite walls", () => {
    const layout = plitka.compute({ ...defaults, start: "center" }, ctx).layout;
    expect(layout?.marks.filter((m) => m.kind === "seam")).toHaveLength(2);
    expect(layout?.guide.map((s) => s.code)).toEqual(["start_center", "cut_walls", "cut_walls", "joint"]);
  });

  it("no door on the plan: the guide asks for it; diagonal and walls have no scheme yet", () => {
    expect(plitka.compute({ ...defaults, openings: [] }, ctx).layout?.guide.at(-1)?.code).toBe("place_door");
    expect(plitka.compute({ ...defaults, layout: "diagonal" }, ctx).layout).toBeUndefined();
    expect(plitka.compute({ ...defaults, surface: "walls" }, ctx).layout).toBeUndefined();
  });
});
