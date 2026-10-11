import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rowsLayout, traceRows } from "../src/blocks/layout-rows";
import { placeOpenings, roomOutline } from "../src/blocks/plan";
import { layRows } from "../src/blocks/rows";
import { laminat } from "../src/tools/laminat";

/** Shoelace area, mm²; positive for a clockwise contour in the plan frame (y down). */
const area = (points: readonly (readonly [number, number])[]) =>
  points.reduce((sum, [x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % points.length] as readonly [number, number];
    return sum + (x1 * y2 - x2 * y1) / 2;
  }, 0);

describe("roomOutline", () => {
  it("rectangle: four walls clockwise from the top-left", () => {
    const { points, walls } = roomOutline(4600, 4300);
    expect(points[0]).toEqual([0, 0]);
    expect(walls.map((w) => [w.side, w.lengthMm])).toEqual([
      ["top", 4600],
      ["right", 4300],
      ["bottom", 4600],
      ["left", 4300],
    ]);
  });

  it("L-shape in every corner: six walls, clockwise, the right area, starting at the top-left-most point", () => {
    for (const corner of ["ne", "se", "sw", "nw"] as const) {
      const { points, walls } = roomOutline(5000, 4000, { lengthMm: 2000, widthMm: 1500 }, corner);
      expect(walls).toHaveLength(6);
      expect(area(points)).toBe(5000 * 4000 - 2000 * 1500);
      expect(walls.reduce((s, w) => s + w.lengthMm, 0)).toBe(2 * (5000 + 4000));
      const [x0, y0] = points[0] as readonly [number, number];
      expect(y0).toBe(0);
      expect(points.every(([x, y]) => y > 0 || x >= x0)).toBe(true);
    }
    expect(roomOutline(5000, 4000, { lengthMm: 2000, widthMm: 1500 }, "nw").points[0]).toEqual([2000, 0]);
  });

  it("a cut-out as large as the room is ignored", () => {
    expect(roomOutline(3000, 3000, { lengthMm: 3000, widthMm: 1000 }).walls).toHaveLength(4);
  });
});

describe("placeOpenings", () => {
  const { walls } = roomOutline(4000, 3000);
  it("measures clockwise along the wall from its first corner", () => {
    const { placed, off } = placeOpenings(walls, [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 500 }] },
    ]);
    expect(off).toBe(0);
    // Bottom wall runs from (4000, 3000) to (0, 3000).
    expect(placed[0]?.mark).toMatchObject({ x1: 3500, y1: 3000, x2: 2700, y2: 3000 });
  });

  it("pulls an opening back onto its wall and counts it; skips missing walls and places past the count", () => {
    const { placed, off } = placeOpenings(walls, [
      {
        type: "window",
        widthMm: 1200,
        heightMm: 1400,
        count: 2,
        places: [
          { wall: 1, offsetMm: 2500 },
          { wall: 7, offsetMm: 0 },
          { wall: 0, offsetMm: 0 },
        ],
      },
    ]);
    expect(placed).toHaveLength(1);
    expect(placed[0]?.mark).toMatchObject({ x1: 4000, y1: 1800, x2: 4000, y2: 3000 });
    expect(off).toBe(2);
  });
});

describe("traceRows replays the engine's plan", () => {
  const replay = (lengths: number[], board: number, offset: number) => {
    const result = layRows({
      rowLengthMm: 0,
      rows: 0,
      rowLengthsMm: lengths,
      boardLengthMm: board,
      minPieceMm: offset,
      minOffsetMm: offset,
    });
    return { result, traced: traceRows(result.plan ?? [], lengths, board, offset) };
  };

  it("counts the same boards and every reused piece names its row", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 9000 }),
        fc.integer({ min: 200, max: 9000 }),
        fc.integer({ min: 1, max: 25 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 600, max: 2500 }),
        fc.integer({ min: 150, max: 500 }),
        (long, short, a, b, board, offset) => {
          const lengths = [...Array(a).fill(long), ...Array(b).fill(Math.min(short, long))];
          const { result, traced } = replay(lengths, board, offset);
          if (traced.boards !== result.boards) return false;
          return traced.rows.every(
            (r, k) =>
              (r.startFromRow === undefined || r.startFromRow < k) &&
              // The left part of a board cut for a row's start may end that same row.
              (r.endFromRow === undefined || r.endFromRow <= k) &&
              (r.startRestToRow === undefined || r.startRestToRow >= k) &&
              (r.restToRow === undefined || r.restToRow > k) &&
              (r.startFrom !== "pool" || r.startFromRow !== undefined),
          );
        },
      ),
      { numRuns: 400 },
    );
  }, 60_000);

  it("mockup room: 23 rows of 4580 mm, 1285 mm boards → 85 boards", () => {
    const { traced } = replay(Array(23).fill(4580), 1285, 300);
    expect(traced.boards).toBe(85);
  });
});

describe("rowsLayout", () => {
  it("pieces fill every row exactly and stay inside the room, whatever the flips and direction", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1500, max: 8000 }),
        fc.integer({ min: 1500, max: 8000 }),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (lengthMm, widthMm, alongLength, flipX, flipY) => {
          const gap = 10;
          const board = 1285;
          const bw = 192;
          const along = (alongLength ? lengthMm : widthMm) - 2 * gap;
          const across = (alongLength ? widthMm : lengthMm) - 2 * gap;
          const rows = Math.ceil(across / bw);
          const lengths = Array(rows).fill(along);
          const plan = layRows({ rowLengthMm: along, rows, boardLengthMm: board, minPieceMm: 300, minOffsetMm: 300 });
          const traced = traceRows(plan.plan ?? [], lengths, board, 300);
          const { pieces } = rowsLayout({
            lengthMm,
            widthMm,
            alongLength,
            gapMm: gap,
            boardLengthMm: board,
            boardWidthMm: bw,
            lastRowMm: across - (rows - 1) * bw,
            rows: traced.rows,
            flipX,
            flipY,
            walls: roomOutline(lengthMm, widthMm).walls,
          });
          const inside = pieces.every(
            (p) =>
              p.x >= gap - 1e-6 &&
              p.y >= gap - 1e-6 &&
              p.x + p.w <= lengthMm - gap + 1e-6 &&
              p.y + p.h <= widthMm - gap + 1e-6,
          );
          const filled = traced.rows.every((r, k) => {
            const sum = pieces.filter((p) => p.row === k).reduce((s, p) => s + (alongLength ? p.w : p.h), 0);
            return Math.abs(sum - r.lengthMm) < 1e-6;
          });
          return inside && filled;
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe("laminate scheme", () => {
  const defaults = laminat.defaults({ country: "RU" });

  it("example room: the scheme comes with the count and the guide uses the placed door and window", () => {
    const result = laminat.compute(defaults, { country: "RU" });
    const layout = result.layout;
    if (!layout) throw new Error("no layout");
    expect(layout.kind).toBe("rows");
    expect(layout.rows).toHaveLength(23);
    expect(layout.stats.whole + layout.stats.cut).toBe(layout.pieces.length);
    expect(layout?.guide.map((s) => s.code)).toEqual(["start", "start_door", "light_along", "rows", "reuse"]);
    // Door in the bottom wall: the laying starts at the top wall (wall 1) and ends at the door.
    expect(layout?.guide[0]?.values).toEqual({ wall: 1, gap: 10 });
    expect(layout?.marks.map((m) => m.kind)).toEqual(["start", "door", "window"]);
  });

  it("door in the start wall: the scheme is mirrored to start at the opposite wall, same count", () => {
    const door = {
      type: "door",
      widthMm: 800,
      heightMm: 2000,
      count: 1,
      places: [{ wall: 0, offsetMm: 600 }],
    } as const;
    const plain = laminat.compute({ ...defaults, openings: [] }, { country: "RU" });
    const result = laminat.compute({ ...defaults, openings: [door] }, { country: "RU" });
    expect(result.items).toEqual(plain.items);
    expect(result.layout?.guide[0]?.values.wall).toBe(3);
    expect(plain.layout?.guide.map((s) => s.code)).toContain("place_openings");
  });

  it("rows across the light from the window are reported in the guide", () => {
    const result = laminat.compute({ ...defaults, direction: "width" }, { country: "RU" });
    expect(result.layout?.guide.map((s) => s.code)).toContain("light_across");
  });

  it("L-shape: pieces avoid the cut-out corner, wherever it is", () => {
    for (const cutCorner of ["ne", "se", "sw", "nw"] as const) {
      const input = { ...defaults, shape: "l" as const, cutCorner };
      const layout = laminat.compute(input, { country: "RU" }).layout;
      expect(layout?.walls).toHaveLength(6);
      const cx = cutCorner === "ne" || cutCorner === "se" ? 4600 - 1500 : 0;
      const cy = cutCorner === "se" || cutCorner === "sw" ? 4300 - 1200 : 0;
      // A piece wholly inside the cut-out would be laid where there is no floor.
      const inCut = (layout?.pieces ?? []).filter(
        (p) => p.x >= cx + 10 && p.x + p.w <= cx + 1500 - 10 && p.y >= cy + 10 && p.y + p.h <= cy + 1200 - 10,
      );
      expect(inCut).toEqual([]);
      expect(layout?.guide.map((s) => s.code)).toContain("start_l");
    }
  });

  it("an opening that does not fit its wall warns", () => {
    const window = {
      type: "window",
      widthMm: 1200,
      heightMm: 1400,
      count: 1,
      places: [{ wall: 1, offsetMm: 4000 }],
    } as const;
    const result = laminat.compute({ ...defaults, openings: [window] }, { country: "RU" });
    expect(result.warnings.map((w) => w.code)).toContain("opening_off_wall");
  });

  it("diagonal laying has no scheme", () => {
    expect(laminat.compute({ ...defaults, method: "diagonal" }, { country: "RU" }).layout).toBeUndefined();
  });
});
