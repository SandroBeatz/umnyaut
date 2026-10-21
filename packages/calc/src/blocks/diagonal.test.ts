import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type DiagonalInput, type DiagonalRect, diagonalGrid } from "./diagonal";

const S = Math.SQRT2;
/** Independent of the module: a cut thinner than 1 mm is no piece, a tile 1 mm over a wall is whole. */
const EPS = 1;
const FAR = 1e7;

type P = [number, number];
interface B {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Projection of points on an axis. */
const span = (pts: P[], ax: P): [number, number] => {
  const d = pts.map(([x, y]) => x * ax[0] + y * ax[1]);
  return [Math.min(...d), Math.max(...d)];
};
const corners = (b: B): P[] => [
  [b.x1, b.y1],
  [b.x2, b.y1],
  [b.x2, b.y2],
  [b.x1, b.y2],
];
const AXES: P[] = [
  [1, 0],
  [0, 1],
  [1 / S, 1 / S],
  [1 / S, -1 / S],
];
/** Separating-axis test: the convex tile and box overlap with positive depth on every axis. */
const overlaps = (tile: P[], b: B) =>
  b.x1 < b.x2 &&
  b.y1 < b.y2 &&
  AXES.every((ax) => {
    const [a1, a2] = span(tile, ax);
    const [b1, b2] = span(corners(b), ax);
    return Math.min(a2, b2) - Math.max(a1, b1) > 0;
  });
const inside = (tile: P[], b: B) => tile.every(([x, y]) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
const grow = (b: B, by: number): B => ({ x1: b.x1 - by, y1: b.y1 - by, x2: b.x2 + by, y2: b.y2 + by });

/** Reference: every tile of the turned grid checked one by one, by its four corners. */
function brute(i: DiagonalInput) {
  const { lengthMm: L, widthMm: W, tileLengthMm: a, tileWidthMm: b, jointMm: j } = i;
  const u0 = i.start === "center" ? (L + W) / 2 / S - a / 2 : 0;
  const v0 = i.start === "center" ? (L - W) / 2 / S - b / 2 : 0;
  const room: B = { x1: 0, y1: 0, x2: L, y2: W };
  const holes = i.holes.map(
    (h: DiagonalRect): B => ({
      x1: h.x <= 0 ? -FAR : h.x,
      y1: h.y <= 0 ? -FAR : h.y,
      x2: h.x + h.w >= L ? FAR : h.x + h.w,
      y2: h.y + h.h >= W ? FAR : h.y + h.h,
    }),
  );
  let whole = 0;
  let cut = 0;
  let dropped = 0;
  const reach = (L + W) / S + a + b;
  for (let k = Math.floor((-reach - u0) / (a + j)); k <= Math.ceil((reach - u0) / (a + j)); k++) {
    for (let m = Math.floor((-reach - v0) / (b + j)); m <= Math.ceil((reach - v0) / (b + j)); m++) {
      const u1 = u0 + k * (a + j);
      const v1 = v0 + m * (b + j);
      const tile: P[] = [
        [u1, v1],
        [u1 + a, v1],
        [u1 + a, v1 + b],
        [u1, v1 + b],
      ].map(([u, v]) => [((u as number) + (v as number)) / S, ((u as number) - (v as number)) / S]);
      if (!overlaps(tile, grow(room, -EPS))) continue;
      if (holes.some((h) => inside(tile, grow(h, EPS)))) {
        dropped++;
        continue;
      }
      if (inside(tile, grow(room, EPS)) && !holes.some((h) => overlaps(tile, grow(h, -EPS)))) whole++;
      else cut++;
    }
  }
  return { whole, cut, dropped };
}

describe("diagonalGrid", () => {
  it("bathroom floor 2,2 × 1,7 m, porcelain 60 × 60, joint 3, from a corner: 17 pieces (4 whole)", () => {
    const i: DiagonalInput = {
      lengthMm: 2200,
      widthMm: 1700,
      tileLengthMm: 600,
      tileWidthMm: 600,
      jointMm: 3,
      start: "corner",
      holes: [],
    };
    expect(diagonalGrid(i)).toEqual({ whole: 4, cut: 13, dropped: 0 });
    expect(brute(i)).toEqual(diagonalGrid(i));
  });

  it("an L-shape's cut-out at the edge drops the tiles inside it, cuts the ones on its inner edges", () => {
    const i: DiagonalInput = {
      lengthMm: 6000,
      widthMm: 5000,
      tileLengthMm: 300,
      tileWidthMm: 300,
      jointMm: 3,
      start: "center",
      holes: [{ x: 3000, y: 3000, w: 3000, h: 2000 }],
    };
    const r = diagonalGrid(i);
    expect(r).toEqual(brute(i));
    expect(r.dropped).toBeGreaterThan(0);
  });

  it("degenerate sizes count nothing", () => {
    expect(
      diagonalGrid({
        lengthMm: 0,
        widthMm: 1000,
        tileLengthMm: 300,
        tileWidthMm: 300,
        jointMm: 0,
        start: "corner",
        holes: [],
      }),
    ).toEqual({ whole: 0, cut: 0, dropped: 0 });
  });

  it("row by row in closed form equals the tile-by-tile reference", () => {
    const hole = (L: number, W: number) =>
      fc.record({ x: fc.integer({ min: 0, max: L }), y: fc.integer({ min: 0, max: W }) }).chain(({ x, y }) =>
        fc.record({
          x: fc.constant(x),
          y: fc.constant(y),
          w: fc.integer({ min: 0, max: L - x }),
          h: fc.integer({ min: 0, max: W - y }),
        }),
      );
    const arb = fc
      .record({ L: fc.integer({ min: 300, max: 4000 }), W: fc.integer({ min: 300, max: 4000 }) })
      .chain(({ L, W }) =>
        fc.record({
          lengthMm: fc.constant(L),
          widthMm: fc.constant(W),
          tileLengthMm: fc.integer({ min: 100, max: 1200 }),
          tileWidthMm: fc.integer({ min: 100, max: 1200 }),
          jointMm: fc.constantFrom(0, 1.5, 2, 3, 5),
          start: fc.constantFrom("corner" as const, "center" as const),
          holes: fc.array(hole(L, W), { maxLength: 3 }),
        }),
      );
    fc.assert(
      fc.property(arb, (i) => {
        expect(diagonalGrid(i)).toEqual(brute(i));
      }),
      { numRuns: 500 },
    );
  });
});
