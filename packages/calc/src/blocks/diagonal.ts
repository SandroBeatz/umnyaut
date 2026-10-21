/**
 * Tiles laid on the diagonal: the grid of `grid.ts` turned by 45° over a rectangle (a floor or one unfolded wall)
 * with rectangular holes in it (an L-shape's cut-out, doors and windows). Counted like the straight grid (Kerama
 * Marazzi, штучный метод): a tile wholly inside the rectangle and clear of every hole is whole, any other tile that
 * touches the surface is cut and takes a tile of its own; a tile wholly inside a hole is not laid.
 *
 * Frame: x to the right, y down, mm. Turned axes u = (x + y) / √2, v = (x − y) / √2; tile (k, m) covers
 * u ∈ [u0 + k·(a + joint), … + a], v ∈ [v0 + m·(b + joint), … + b]. From a corner a tile's vertex sits in the
 * top-left corner (half tiles along the two start walls); from the centre a tile's middle sits in the middle.
 * Counted row by row in closed form, so a large room costs one pass over the rows, not over every tile.
 */

export interface DiagonalRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagonalInput {
  lengthMm: number;
  widthMm: number;
  /** Tile side along u (the room length turned by 45°) and along v. */
  tileLengthMm: number;
  tileWidthMm: number;
  jointMm: number;
  start: "corner" | "center";
  /** Cut-outs and openings in the same frame; a hole touching the edge is taken as open past it. */
  holes: readonly DiagonalRect[];
}

export interface DiagonalCount {
  whole: number;
  cut: number;
  /** Tiles wholly inside the holes: not laid. */
  dropped: number;
}

const SQRT2 = Math.SQRT2;
/** A tile has to reach 0,5 mm into the surface to count, and may stick out 0,5 mm and still be whole. */
const EPS_MM = 0.5;
/** «Open past the edge» for a hole at the room's edge: far beyond any room (≤ 100 m). */
const FAR_MM = 1e7;

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const grown = (b: Box, by: number): Box => ({ x1: b.x1 - by, y1: b.y1 - by, x2: b.x2 + by, y2: b.y2 + by });

/** v of the points of the box on the line u: x = (u + v) / √2 ∈ [x1, x2], y = (u − v) / √2 ∈ [y1, y2]. */
function atU(b: Box, u: number): [number, number] {
  return [Math.max(SQRT2 * b.x1 - u, u - SQRT2 * b.y2), Math.min(SQRT2 * b.x2 - u, u - SQRT2 * b.y1)];
}

/** v-extent of the strip u ∈ [ua, ub] cut by the box; empty (lo > hi) when they miss. */
function stripV(b: Box, ua: number, ub: number): [number, number] {
  const from = Math.max(ua, (b.x1 + b.y1) / SQRT2);
  const to = Math.min(ub, (b.x2 + b.y2) / SQRT2);
  if (from > to) return [1, 0];
  const clamp = (u: number) => Math.min(Math.max(u, from), to);
  // The lower bound is convex in u with its least value at (x1 + y2) / √2, the upper concave with its peak at (x2 + y1) / √2.
  return [atU(b, clamp((b.x1 + b.y2) / SQRT2))[0], atU(b, clamp((b.x2 + b.y1) / SQRT2))[1]];
}

/** Tile indexes m whose v-span [v0 + m·p, v0 + m·p + t] crosses into (lo, hi), as [first, last]. */
function crossing(lo: number, hi: number, v0: number, p: number, t: number): [number, number] {
  if (!(lo < hi)) return [1, 0];
  return [Math.floor((lo - t - v0) / p) + 1, Math.ceil((hi - v0) / p) - 1];
}

/** Tile indexes m whose v-span lies within [lo, hi]. */
function within(lo: number, hi: number, v0: number, p: number, t: number): [number, number] {
  if (!(lo <= hi)) return [1, 0];
  return [Math.ceil((lo - v0) / p), Math.floor((hi - t - v0) / p)];
}

/** How many integers of [a, b] are not in the union of `cover`. */
function outside([a, b]: [number, number], cover: [number, number][]): number {
  if (b < a) return 0;
  const parts = cover
    .map(([c, d]): [number, number] => [Math.max(c, a), Math.min(d, b)])
    .filter(([c, d]) => c <= d)
    .sort((p, q) => p[0] - q[0]);
  let taken = 0;
  let end = a - 1;
  for (const [c, d] of parts) {
    const from = Math.max(c, end + 1);
    if (d >= from) taken += d - from + 1;
    end = Math.max(end, d);
  }
  return b - a + 1 - taken;
}

const meet = (p: [number, number], q: [number, number]): [number, number] => [
  Math.max(p[0], q[0]),
  Math.min(p[1], q[1]),
];

export function diagonalGrid(i: DiagonalInput): DiagonalCount {
  const L = i.lengthMm;
  const W = i.widthMm;
  const a = i.tileLengthMm;
  const b = i.tileWidthMm;
  const pu = a + i.jointMm;
  const pv = b + i.jointMm;
  if (!(L > 0 && W > 0 && a > 0 && b > 0)) return { whole: 0, cut: 0, dropped: 0 };
  const u0 = i.start === "center" ? (L + W) / 2 / SQRT2 - a / 2 : 0;
  const v0 = i.start === "center" ? (L - W) / 2 / SQRT2 - b / 2 : 0;

  const room: Box = { x1: 0, y1: 0, x2: L, y2: W };
  const holes = i.holes
    .filter((h) => h.w > 0 && h.h > 0)
    .map(
      (h): Box => ({
        x1: h.x <= 0 ? -FAR_MM : h.x,
        y1: h.y <= 0 ? -FAR_MM : h.y,
        x2: h.x + h.w >= L ? FAR_MM : h.x + h.w,
        y2: h.y + h.h >= W ? FAR_MM : h.y + h.h,
      }),
    );
  const touchRoom = grown(room, -EPS_MM);
  const inRoom = grown(room, EPS_MM);

  let whole = 0;
  let pieces = 0;
  let dropped = 0;
  const kFirst = Math.floor((0 - u0 - a) / pu);
  const kLast = Math.ceil(((L + W) / SQRT2 - u0) / pu);
  for (let k = kFirst; k <= kLast; k++) {
    const ua = u0 + k * pu;
    const ub = ua + a;
    const touchV = stripV(touchRoom, ua, ub);
    const touch = crossing(touchV[0], touchV[1], v0, pv, b);
    if (touch[1] < touch[0]) continue;
    const insideV = meet(atU(inRoom, ua), atU(inRoom, ub));
    const inside = meet(within(insideV[0], insideV[1], v0, pv, b), touch);
    const holeTouch: [number, number][] = [];
    const holeIn: [number, number][] = [];
    for (const h of holes) {
      const core = grown(h, -EPS_MM);
      // A hole no thicker than the tolerance cuts nothing.
      if (core.x1 < core.x2 && core.y1 < core.y2) {
        const t = stripV(core, ua, ub);
        holeTouch.push(crossing(t[0], t[1], v0, pv, b));
      }
      const g = grown(h, EPS_MM);
      const n = meet(atU(g, ua), atU(g, ub));
      holeIn.push(meet(within(n[0], n[1], v0, pv, b), touch));
    }
    const laid = outside(touch, holeIn);
    pieces += laid;
    dropped += touch[1] - touch[0] + 1 - laid;
    whole += outside(inside, [...holeTouch, ...holeIn]);
  }
  return { whole, cut: pieces - whole, dropped };
}
