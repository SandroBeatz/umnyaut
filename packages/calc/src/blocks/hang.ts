import type { ElevationOpening } from "../types";

/**
 * Wallpaper hung wall by wall (docs/ui/room-plan-and-layout-guides.md, wallpaper). The first strip is set by a
 * level line on the start wall, never by a corner (corners are rarely plumb). From that line the strips go
 * clockwise, butt to each other, up to the closing corner; then from the same line anticlockwise to that corner.
 * At every corner on the way a strip is cut lengthwise: it wraps round the corner (inner and outer corners have
 * their own wrap) and its rest, if at least `minCarryMm` wide, goes on the next wall overlapping the wrap, set by
 * a new level line. At the closing corner the anticlockwise side wraps onto the clockwise one.
 * A strip lying wholly across an opening (a window or a bare zone with `marginMm` to spare on each side, a door
 * edge to edge) is not hung full height: pieces cover what is left above and below; a strip that only partly
 * covers an opening stays full height and is cut round it.
 */
export interface HangWall {
  lengthMm: number;
  /** Doors, windows and bare zones in the wall's frame: x from its first corner, y down from the ceiling. */
  openings: readonly ElevationOpening[];
}

export interface HangInput {
  /** Walls clockwise; corner k joins wall k to wall k + 1. */
  walls: readonly HangWall[];
  /** Wrap round corner k, mm (inner and outer corners differ). */
  wrapsMm: readonly number[];
  heightMm: number;
  rollWidthMm: number;
  minCarryMm: number;
  minPieceMm: number;
  /** Trim allowance added to every piece (strips get it in the tool). */
  trimMm: number;
  /** A strip becomes pieces only this far inside a window or a bare zone on both sides; doors none (casing). */
  marginMm: number;
  /** The level line of the first strip: wall and distance from the wall's first corner. */
  start: { wall: number; lineMm: number };
  /** Corner where the two directions meet (the last, least visible joint). */
  closingCorner: number;
}

/** A column of wallpaper on a wall. */
export interface HangColumn {
  /**
   * Full-height strips are numbered 1, 2, … in hanging order (a `carry` shows the number of the strip it is the
   * rest of); `pieces` columns have their own numbers 1, 2, … («К1»).
   */
  n: number;
  /** On the wall, mm. */
  x: number;
  w: number;
  /**
   * `full` — a strip floor to ceiling; `corner` — a strip cut lengthwise at a corner (its other part wraps round
   * it, the rest is carried to the next wall); `carry` — that rest on the next wall; `closing` — the last strip of a
   * direction, cut lengthwise to what is left; `pieces` — pieces above and below an opening instead of a strip.
   */
  kind: "full" | "corner" | "carry" | "closing" | "pieces";
  /** Pieces of a `pieces` column: y down from the ceiling, height on the wall, cut length with the trim. */
  pieces?: readonly { y: number; h: number; lengthMm: number; where: "above" | "below" }[];
}

/** One full-length strip cut from a roll, and what it is cut into lengthwise. */
export interface HangBlank {
  n: number;
  /** Hanging order: 0, 1, 2 … clockwise from the line, −1, −2 … anticlockwise (pattern phase by parity). */
  order: number;
  /** Parts on the walls, mm wide: a corner strip gives the part up to the corner with its wrap, then the carried rest. */
  parts: readonly { wall: number; widthMm: number }[];
  /** Width of the strip left after the parts (full height), mm. */
  restMm: number;
}

export interface HangedWall {
  columns: HangColumn[];
  /** Level lines on this wall: the edge of the first new strip after the start line or a corner, mm from the first corner. */
  linesMm: number[];
}

export interface HangResult {
  walls: HangedWall[];
  blanks: HangBlank[];
  /** Pieces with the number of their pieces column and its hanging order (pattern phase). */
  pieces: {
    n: number;
    order: number;
    lengthMm: number;
    widthMm: number;
    where: "above" | "below";
    wall: number;
    y: number;
  }[];
  /** Full-height parts on the walls narrower than `narrowMm` (awkward inserts). */
  narrow: number;
  /** Narrowest full-height part on a wall, mm (∞ when every one is a whole roll width). */
  narrowestMm: number;
}

const EPS = 1e-6;

interface Segment {
  wall: number;
  length: number;
  /** Anticlockwise: coordinates run from the wall's end. */
  mirrored: boolean;
  from: number;
  to: number;
  openings: readonly ElevationOpening[];
  /** Wrap at the end of this segment onto the next wall; on the last segment, onto the closing side (0: none). */
  wrapMm: number;
}

const mirror = (o: ElevationOpening, L: number): ElevationOpening => ({ ...o, x: L - o.x - o.w });

/** Hang strips along segments in one direction; coordinates inside a segment run in the hanging direction. */
function hangRun(
  i: HangInput,
  segments: readonly Segment[],
  sign: 1 | -1,
  counters: { n: number; k: number },
  out: HangResult,
  columns: HangColumn[][],
  lines: number[][],
) {
  const W = i.rollWidthMm;
  let carry = 0;
  let carryFrom = 0;
  // A strip that ended at a corner without its full wrap: the next wall's first strip wraps back by the rest.
  let short = 0;
  let order = sign === 1 ? 0 : 1;
  segments.forEach((seg, j) => {
    const last = j === segments.length - 1;
    const push = (c: HangColumn) => columns[seg.wall]?.push({ ...c, x: seg.mirrored ? seg.length - c.x - c.w : c.x });
    let x = seg.from;
    if (short > 0 && carry === 0) x -= short;
    short = 0;
    if (carry > 0) {
      const w = Math.min(carry, seg.to - x);
      if (w > EPS) push({ n: carryFrom, x, w, kind: "carry" });
      // A rest wider than a short wall goes round its next corner too.
      const over = x + carry - seg.to;
      x += carry;
      carry = !last && over - seg.wrapMm >= i.minCarryMm ? over - seg.wrapMm : 0;
      if (x >= seg.to - EPS) return;
      carry = 0;
    }
    let first = true;
    while (x < seg.to - EPS) {
      const x1 = x + W;
      if (first) {
        lines[seg.wall]?.push(seg.mirrored ? seg.length - x : x);
        first = false;
      }
      if (x1 > seg.to - EPS && (x1 > seg.to + EPS || seg.wrapMm > 0)) {
        // Across the end (or right at a corner): cut lengthwise. At a corner the rest is carried on; at the end of
        // the run it is left over.
        counters.n++;
        const n = counters.n;
        const onWall = seg.to - Math.max(x, 0);
        const wrap = Math.min(seg.wrapMm, W - (seg.to - x));
        if (!last && wrap < seg.wrapMm - EPS) short = seg.wrapMm - wrap;
        const rest = W - (seg.to - x) - wrap;
        const next = segments[j + 1];
        const parts = [{ wall: seg.wall, widthMm: onWall + wrap }];
        let restMm = rest;
        if (!last && next && rest >= i.minCarryMm) {
          carry = rest;
          carryFrom = n;
          restMm = 0;
          parts.push({ wall: next.wall, widthMm: rest });
        }
        push({ n, x: Math.max(x, 0), w: onWall, kind: last ? "closing" : "corner" });
        out.blanks.push({ n, order: sign * order, parts, restMm });
        order++;
      } else {
        const x0 = x;
        const over = seg.openings.filter((o) => {
          const margin = o.type === "door" ? 0 : i.marginMm;
          return o.x + margin <= x0 + EPS && x1 <= o.x + o.w - margin + EPS;
        });
        if (over.length > 0) {
          // What is left of the column above, between and below the openings it lies across.
          const holes = over.map((o) => [o.y, o.y + o.h] as const).sort((a, b) => a[0] - b[0]);
          const gaps: [number, number][] = [];
          let y = 0;
          for (const [a, b] of holes) {
            if (a > y) gaps.push([y, a]);
            y = Math.max(y, b);
          }
          if (y < i.heightMm) gaps.push([y, i.heightMm]);
          const pieces = gaps
            .filter(([a, b]) => b - a >= i.minPieceMm)
            .map(([a, b]) => ({
              y: a,
              h: b - a,
              lengthMm: b - a + i.trimMm,
              where: a === 0 ? ("above" as const) : ("below" as const),
            }));
          // Nothing left to cover (a bare zone floor to ceiling): no column at all.
          if (pieces.length > 0) counters.k++;
          for (const p of pieces)
            out.pieces.push({
              n: counters.k,
              order: sign * order,
              lengthMm: p.lengthMm,
              widthMm: W,
              where: p.where,
              wall: seg.wall,
              y: p.y,
            });
          if (pieces.length > 0) push({ n: counters.k, x, w: W, kind: "pieces", pieces });
        } else {
          counters.n++;
          // A first strip wrapping back round the corner shows only its part on this wall.
          push({ n: counters.n, x: Math.max(x, 0), w: x1 - Math.max(x, 0), kind: x < -EPS ? "corner" : "full" });
          out.blanks.push({ n: counters.n, order: sign * order, parts: [{ wall: seg.wall, widthMm: W }], restMm: 0 });
        }
        order++;
      }
      x = x1;
    }
  });
}

export function hangStrips(i: HangInput, narrowMm = 100): HangResult {
  const count = i.walls.length;
  const out: HangResult = { walls: [], blanks: [], pieces: [], narrow: 0, narrowestMm: Number.POSITIVE_INFINITY };
  const columns: HangColumn[][] = i.walls.map(() => []);
  const lines: number[][] = i.walls.map(() => []);
  const s = ((i.start.wall % count) + count) % count;
  const c = ((i.closingCorner % count) + count) % count;
  const L = (k: number) => i.walls[k]?.lengthMm ?? 0;
  const ops = (k: number) => i.walls[k]?.openings ?? [];
  const line = Math.min(Math.max(i.start.lineMm, 0), L(s));
  const before = (s - 1 + count) % count;

  // Clockwise: from the line to the end of wall s, then walls s + 1 … c.
  const cw: Segment[] = [{ wall: s, length: L(s), mirrored: false, from: line, to: L(s), openings: ops(s), wrapMm: 0 }];
  // The closing corner right before the start wall: the clockwise side goes all the way round.
  const fullCircle = c === before;
  for (let k = s; k !== c; k = (k + 1) % count) {
    const prev = cw[cw.length - 1];
    if (prev) prev.wrapMm = i.wrapsMm[k] ?? 0;
    const next = (k + 1) % count;
    cw.push({ wall: next, length: L(next), mirrored: false, from: 0, to: L(next), openings: ops(next), wrapMm: 0 });
  }
  // The anticlockwise side wraps onto the end of wall c: the clockwise side stops that short of the corner.
  const end = cw[cw.length - 1];
  if (end) end.to = Math.max(end.to - (i.wrapsMm[c] ?? 0), end.from);

  // Anticlockwise: from the line back to the start of wall s, then walls s − 1 … c + 1, mirrored.
  const ccw: Segment[] = [
    {
      wall: s,
      length: L(s),
      mirrored: true,
      from: L(s) - line,
      to: L(s),
      openings: ops(s).map((o) => mirror(o, L(s))),
      wrapMm: 0,
    },
  ];
  if (!fullCircle) {
    for (let k = s; k !== (c + 1) % count; k = (k - 1 + count) % count) {
      const corner = (k - 1 + count) % count;
      const prev = ccw[ccw.length - 1];
      if (prev) prev.wrapMm = i.wrapsMm[corner] ?? 0;
      ccw.push({
        wall: corner,
        length: L(corner),
        mirrored: true,
        from: 0,
        to: L(corner),
        openings: ops(corner).map((o) => mirror(o, L(corner))),
        wrapMm: 0,
      });
    }
  }
  const ccwEnd = ccw[ccw.length - 1];
  if (ccwEnd) ccwEnd.wrapMm = i.wrapsMm[c] ?? 0;

  const counters = { n: 0, k: 0 };
  hangRun(i, cw, 1, counters, out, columns, lines);
  hangRun(
    i,
    ccw.filter((g, j) => j > 0 || g.to - g.from > EPS),
    -1,
    counters,
    out,
    columns,
    lines,
  );

  out.walls = columns.map((cols, k) => ({
    columns: cols.sort((a, b) => a.x - b.x),
    linesMm: [...new Set(lines[k] ?? [])].sort((a, b) => a - b),
  }));
  for (const cols of columns)
    for (const col of cols)
      if (col.kind !== "pieces" && col.w < i.rollWidthMm - EPS) {
        out.narrowestMm = Math.min(out.narrowestMm, col.w);
        if (col.w < narrowMm) out.narrow++;
      }
  return out;
}
