import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { gridLine } from "../src/blocks/grid";
import { gridCells, wallGrid } from "../src/blocks/layout-grid";
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
    const result = plitka.compute(
      { ...defaults, tileLengthMm: 600, tileWidthMm: 300, lengthMm: 4320, widthMm: 4340 },
      ctx,
    );
    // Along the length: 7 × 603 = 4221, cut 99 mm < 600 / 4 (wider than a quarter of 300); across: 98 mm ≥ 300 / 4.
    expect(result.layout?.guide.map((s) => s.code)).toContain("try_center");
  });

  it("from the centre: axes instead of a start corner, equal cuts at opposite walls", () => {
    const layout = plitka.compute({ ...defaults, start: "center" }, ctx).layout;
    expect(layout?.marks.filter((m) => m.kind === "seam")).toHaveLength(2);
    expect(layout?.guide.map((s) => s.code)).toEqual(["start_center", "cut_walls", "cut_walls", "joint"]);
  });

  it("no door on the plan: the guide asks for it; the diagonal has no scheme yet", () => {
    expect(plitka.compute({ ...defaults, openings: [] }, ctx).layout?.guide.at(-1)?.code).toBe("place_door");
    expect(plitka.compute({ ...defaults, layout: "diagonal" }, ctx).layout).toBeUndefined();
    expect(plitka.compute({ ...defaults, surface: "walls", layout: "diagonal" }, ctx).layout).toBeUndefined();
  });
});

describe("wallGrid", () => {
  it("no tile wholly inside an opening; every tile over its edge is cut; tiles stay on the wall", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 6000 }),
        fc.integer({ min: 1000, max: 4000 }),
        fc.integer({ min: 50, max: 1200 }),
        fc.integer({ min: 50, max: 1200 }),
        fc.integer({ min: 0, max: 5 }),
        fc.constantFrom("corner", "center" as const),
        fc.record({
          x: fc.nat(6000),
          y: fc.nat(4000),
          w: fc.integer({ min: 100, max: 3000 }),
          h: fc.integer({ min: 100, max: 3000 }),
        }),
        (lengthMm, heightMm, tileLengthMm, tileWidthMm, jointMm, start, o) => {
          const opening = { type: "window" as const, ...o };
          const g = wallGrid({ lengthMm, heightMm, tileLengthMm, tileWidthMm, jointMm, start, openings: [opening] });
          const free = wallGrid({ lengthMm, heightMm, tileLengthMm, tileWidthMm, jointMm, start, openings: [] });
          return (
            g.pieces.length + g.dropped === free.pieces.length &&
            g.pieces.every(
              (p) =>
                p.x >= -1e-6 &&
                p.y >= -1e-6 &&
                p.x + p.w <= lengthMm + 1e-6 &&
                p.y + p.h <= heightMm + 1e-6 &&
                !(p.x >= o.x && p.x + p.w <= o.x + o.w && p.y >= o.y && p.y + p.h <= o.y + o.h) &&
                (p.cut || !(p.x < o.x + o.w && p.x + p.w > o.x && p.y < o.y + o.h && p.y + p.h > o.y)),
            )
          );
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe("tile walls scheme", () => {
  const walls = { ...defaults, surface: "walls" as const };

  it("example room: four walls unfolded, the scheme's tiles are the purchase, door and window on their walls", () => {
    const result = plitka.compute(walls, ctx);
    const layout = result.layout;
    if (!layout?.elevations) throw new Error("no elevations");
    expect(layout.elevations.map((e) => e.lengthMm)).toEqual([4600, 4300, 4600, 4300]);
    const pieces = layout.elevations.flatMap((e) => e.pieces);
    expect(pieces.filter((p) => !p.cut).length).toBe(summary(result, "whole"));
    expect(pieces.filter((p) => p.cut).length).toBe(summary(result, "cut"));
    expect(layout.stats).toMatchObject({ whole: 406, cut: 128 });
    // Door on wall 3 from the floor, window on wall 4 with the default sill (900…2300 from the floor).
    expect(layout.elevations[2]?.openings).toEqual([{ type: "door", x: 600, y: 700, w: 800, h: 2000 }]);
    expect(layout.elevations[3]?.openings).toEqual([{ type: "window", x: 1550, y: 400, w: 1200, h: 1400 }]);
    expect(layout.elevations[0]).toMatchObject({ cutColumns: [55], cutRows: [276], aroundOpenings: 0 });
    expect(layout.elevations[2]?.aroundOpenings).toBe(16);
    expect(layout.guide.map((s) => s.code)).toEqual([
      "walls_corner",
      "walls_cut_top",
      "walls_batten",
      "walls_openings",
      "walls_sill",
      "try_center",
      "joint",
    ]);
  });

  // plitka v6 (formula review 2026-10-21): the tiled height is a band from the floor — a window through its top is
  // clipped there (it used to be moved down under it with a `window_above_ceiling` warning).
  it("a window through the top of the tiled band is clipped at it; a door taller than the wall ends there", () => {
    const openings = [
      {
        type: "window" as const,
        widthMm: 1200,
        heightMm: 1400,
        count: 1,
        places: [{ wall: 0, offsetMm: 0, sillMm: 2000 }],
      },
      { type: "door" as const, widthMm: 800, heightMm: 3000, count: 1, places: [{ wall: 1, offsetMm: 0 }] },
    ];
    const result = plitka.compute({ ...walls, openings }, ctx);
    const layout = result.layout;
    expect(result.warnings.map((w) => w.code)).not.toContain("window_above_ceiling");
    // Sill 2000, top 3400 → only 2000…2700 is in the tiled band.
    expect(layout?.elevations?.[0]?.openings[0]).toMatchObject({ y: 0, h: 700 });
    expect(layout?.elevations?.[1]?.openings[0]).toMatchObject({ y: 0, h: 2700 });
    expect(layout?.guide.map((s) => s.code)).not.toContain("walls_sill");
  });

  it("a window wholly above the tiled band is not on the wall at all", () => {
    const openings = [
      {
        type: "window" as const,
        widthMm: 1200,
        heightMm: 1400,
        count: 1,
        places: [{ wall: 0, offsetMm: 0, sillMm: 1000 }],
      },
    ];
    const result = plitka.compute({ ...walls, heightMm: 1000, openings }, ctx);
    expect(result.layout?.elevations?.[0]?.openings).toEqual([]);
  });

  it("an opening wider than its wall is off the plan: the estimate and a warning", () => {
    const openings = [
      { type: "window" as const, widthMm: 5000, heightMm: 1000, count: 1, places: [{ wall: 1, offsetMm: 0 }] },
    ];
    const result = plitka.compute({ ...walls, openings }, ctx);
    expect(result.warnings.map((w) => w.code)).toContain("opening_off_wall");
    expect(result.layout?.guide.at(-1)?.code).toBe("place_openings");
  });

  it("an opening not placed: walls without tiles, the estimate, the guide asks to place it", () => {
    const openings = [{ type: "door" as const, widthMm: 800, heightMm: 2000, count: 1 }];
    const result = plitka.compute({ ...walls, openings }, ctx);
    expect(result.layout?.elevations?.every((e) => e.pieces.length === 0)).toBe(true);
    expect(result.layout?.guide.at(-1)?.code).toBe("place_openings");
    expect(result.steps.map((s) => s.code)).toContain("openings");
  });

  it("placed openings never cost more tiles than the estimate, and the scheme is the purchase", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1200, max: 8000 }),
        fc.integer({ min: 1200, max: 8000 }),
        fc.integer({ min: 2200, max: 3500 }),
        fc.integer({ min: 100, max: 900 }),
        fc.integer({ min: 100, max: 900 }),
        fc.integer({ min: 0, max: 5 }),
        fc.constantFrom("corner", "center" as const),
        fc.uniqueArray(
          fc.record({
            type: fc.constantFrom("door" as const, "window" as const),
            widthMm: fc.integer({ min: 400, max: 1100 }),
            heightMm: fc.integer({ min: 400, max: 2100 }),
            wall: fc.constantFrom(0, 1, 2, 3),
            offset: fc.double({ min: 0, max: 1, noNaN: true }),
            sillMm: fc.option(fc.integer({ min: 0, max: 1500 }), { nil: undefined }),
          }),
          // One per wall: openings on top of each other would be subtracted twice by the estimate.
          { maxLength: 4, selector: (o) => o.wall },
        ),
        (lengthMm, widthMm, heightMm, tileLengthMm, tileWidthMm, jointMm, start, list) => {
          const wallLength = (w: number) => (w % 2 === 0 ? lengthMm : widthMm);
          const placed = list.map((o) => ({
            type: o.type,
            widthMm: o.widthMm,
            heightMm: o.heightMm,
            count: 1,
            places: [
              {
                wall: o.wall,
                offsetMm: Math.floor(o.offset * Math.max(wallLength(o.wall) - o.widthMm, 0)),
                ...(o.sillMm === undefined ? {} : { sillMm: o.sillMm }),
              },
            ],
          }));
          const base = { ...walls, lengthMm, widthMm, heightMm, tileLengthMm, tileWidthMm, jointMm, start };
          const exact = plitka.compute({ ...base, openings: placed }, ctx);
          const estimate = plitka.compute({ ...base, openings: placed.map(({ places, ...o }) => o) }, ctx);
          const pieces = exact.layout?.elevations?.flatMap((e) => e.pieces) ?? [];
          const tiles = (r: typeof exact) => r.items.find((it) => it.key === "tile")?.need.value ?? 0;
          return (
            tiles(exact) <= tiles(estimate) &&
            pieces.length === (summary(exact, "whole") ?? 0) + (summary(exact, "cut") ?? 0)
          );
        },
      ),
      { numRuns: 300 },
    );
  });
});
