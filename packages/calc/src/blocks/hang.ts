import type { ElevationOpening } from "../types";

/**
 * Wallpaper hung wall by wall (docs/ui/room-plan-and-layout-guides.md, wallpaper). The first strip is set by a
 * level line on the start wall, never by a corner (corners are rarely plumb). From that line the strips go
 * clockwise, butt to each other, up to the closing corner; then from the same line anticlockwise to that corner.
 * At every corner on the way a strip is cut lengthwise: it wraps round the corner (inner and outer corners have
 * their own wrap) and its rest, if at least `minCarryMm` wide, goes on the next wall overlapping the wrap, set by
 * a new level line. At the closing corner the anticlockwise side wraps onto the clockwise one.
 * Doors, windows and bare zones that touch across the wall (a balcony door beside its window) are one opening.
 * A strip lying wholly across an opening (a window or a bare zone with `marginMm` to spare on each side, a door
 * edge to edge) is not hung full height: pieces cover what is left above and below. A strip that only partly
 * covers an opening is, by default, hung whole and trimmed round it on the wall (manufacturers' way: no joint at
 * the corner of the opening, where cracks start); what is cut off over the opening is a rest for pieces. With
 * `edgeCut` it is cut lengthwise at the opening's edge instead: the part on the wall goes full height, the part
 * over the opening becomes pieces — fewer full-length strips, but joints at the corners of openings.
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
  /** Cut strips lengthwise at the edges of openings (joints there) instead of hanging them whole and trimming. */
  edgeCut?: boolean;
  /** Pieces are cut the whole strip wide from its left edge (a pattern keeps its place across the roll). */
  keepWidth?: boolean;
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
   * direction, cut lengthwise to what is left; `edge` — a strip cut lengthwise at the edge of an opening (the part
   * on the wall, full height); `pieces` — pieces above and below an opening instead of a strip.
   */
  kind: "full" | "corner" | "carry" | "closing" | "edge" | "pieces";
  /**
   * Pieces of a `pieces` column: across the wall (x, w — part of the column next to a door beside a window),
   * y down from the ceiling, height on the wall, cut length with the trim.
   */
  pieces?: readonly { x: number; w: number; y: number; h: number; lengthMm: number; where: "above" | "below" }[];
}

/** What is cut off a strip hung whole over an opening: a rest for pieces, in the strip's frame. */
export interface HangCutout {
  /** Across the strip from its left edge and down from the ceiling line, mm. */
  xMm: number;
  fromMm: number;
  lengthMm: number;
  widthMm: number;
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
  /** Cut off over openings after hanging (a strip hung whole and trimmed round them). */
  cutouts?: readonly HangCutout[];
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
  /** How far the two sides overlap round the closing corner, mm (should be at least its wrap). */
  closingOverlapMm: number;
  /** Pieces narrower than `narrowMm` (between two openings or at the edge of one). */
  slivers: number;
  /** Joints at the edges of openings (`edgeCut`). */
  edges: number;
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

/** Openings closer than this across the wall are one (the wall between them is too narrow to paper). */
const BLOCK_GAP_MM = 20;

/** Openings that touch or overlap across the wall, with each one's part of it. */
interface Block {
  x0: number;
  x1: number;
  items: { o: ElevationOpening; x0: number; x1: number }[];
}

function blocksOf(openings: readonly ElevationOpening[]): Block[] {
  const out: Block[] = [];
  for (const o of [...openings].sort((a, b) => a.x - b.x)) {
    const last = out[out.length - 1];
    if (last && o.x <= last.x1 + BLOCK_GAP_MM) {
      // A small gap between neighbours goes to the one before it: no sliver of bare wall between them.
      if (o.x > last.x1) for (const it of last.items) if (it.x1 >= last.x1 - EPS) it.x1 = o.x;
      last.items.push({ o, x0: o.x, x1: o.x + o.w });
      last.x1 = Math.max(last.x1, o.x + o.w);
    } else out.push({ x0: o.x, x1: o.x + o.w, items: [{ o, x0: o.x, x1: o.x + o.w }] });
  }
  return out;
}

type Piece = NonNullable<HangColumn["pieces"]>[number];

/** Pieces covering [u, v] of a block: above, between and below the openings over each part of it. */
function piecesIn(b: Block, u: number, v: number, i: HangInput): Piece[] {
  const xs = [u, v, ...b.items.flatMap((it) => [it.x0, it.x1]).filter((e) => e > u + EPS && e < v - EPS)].sort(
    (a, c) => a - c,
  );
  const out: Piece[] = [];
  for (let k = 0; k + 1 < xs.length; k++) {
    const a = xs[k] as number;
    const c = xs[k + 1] as number;
    if (c - a <= EPS) continue;
    const holes = b.items
      .filter((it) => it.x0 <= a + EPS && it.x1 >= c - EPS)
      .map((it) => [it.o.y, it.o.y + it.o.h] as const)
      .sort((p, q) => p[0] - q[0]);
    let y = 0;
    const gaps: [number, number][] = [];
    for (const [top, bottom] of holes) {
      if (top > y) gaps.push([y, top]);
      y = Math.max(y, bottom);
    }
    if (y < i.heightMm) gaps.push([y, i.heightMm]);
    for (const [top, bottom] of gaps)
      if (bottom - top >= i.minPieceMm)
        out.push({
          x: a,
          w: c - a,
          y: top,
          h: bottom - top,
          lengthMm: bottom - top + i.trimMm,
          where: top === 0 ? "above" : "below",
        });
  }
  // Side by side at the same height (over a door and its window): one piece.
  const merged: Piece[] = [];
  for (const p of out.sort((a, c) => a.y - c.y || a.x - c.x)) {
    const prev = merged[merged.length - 1];
    if (prev && prev.y === p.y && prev.h === p.h && Math.abs(prev.x + prev.w - p.x) < EPS)
      merged[merged.length - 1] = { ...prev, w: prev.w + p.w };
    else merged.push(p);
  }
  return merged;
}

/** The column [x0, x1] across the openings it touches: parts on the wall and parts over an opening, in order. */
function partsOf(hit: readonly Block[], x0: number, x1: number) {
  const parts: { kind: "wall" | "open"; u: number; v: number; b?: Block }[] = [];
  let x = x0;
  for (const b of hit) {
    const u = Math.max(b.x0, x0);
    const v = Math.min(b.x1, x1);
    if (u > x + EPS) parts.push({ kind: "wall", u: x, v: u });
    parts.push({ kind: "open", u, v, b });
    x = v;
  }
  if (x1 > x + EPS) parts.push({ kind: "wall", u: x, v: x1 });
  return parts;
}

/** Hang strips along segments in one direction; coordinates inside a segment run in the hanging direction. */
function hangRun(
  i: HangInput,
  segments: readonly Segment[],
  sign: 1 | -1,
  counters: { n: number; k: number },
  out: HangResult,
  columns: HangColumn[][],
  lines: number[][],
  narrowMm: number,
): number {
  const W = i.rollWidthMm;
  const edgeCut = !!i.edgeCut && !i.keepWidth;
  /** How much of the wrap the last strip of the run could not give at its end (the closing corner). */
  let shortAtEnd = 0;
  let carry = 0;
  let carryFrom = 0;
  // A strip that ended at a corner without its full wrap: the next wall's first strip wraps back by the rest.
  let short = 0;
  let order = sign === 1 ? 0 : 1;
  segments.forEach((seg, j) => {
    const last = j === segments.length - 1;
    // Nothing hung on the last segment (it is empty): no wrap from this side at all.
    if (last && seg.wrapMm > 0 && carry === 0 && seg.to - seg.from <= EPS) shortAtEnd = seg.wrapMm;
    const at = (x: number, w: number) => (seg.mirrored ? seg.length - x - w : x);
    const push = (c: HangColumn) =>
      columns[seg.wall]?.push({
        ...c,
        x: at(c.x, c.w),
        ...(c.pieces ? { pieces: c.pieces.map((p) => ({ ...p, x: at(p.x, p.w) })) } : {}),
      });
    const blocks = blocksOf(seg.openings);
    const hitting = (x0: number, x1: number) => blocks.filter((b) => b.x1 > x0 + EPS && b.x0 < x1 - EPS);
    /** Pieces instead of a strip over the part [u, v] of an opening: one column, its own number («К»). */
    const piecesColumn = (open: readonly { b: Block; u: number; v: number }[]) => {
      const pieces = open.flatMap((p) => piecesIn(p.b, p.u, p.v, i));
      // Nothing left to cover (a bare zone floor to ceiling): no column at all.
      if (pieces.length === 0) return;
      counters.k++;
      for (const p of pieces)
        out.pieces.push({
          n: counters.k,
          order: sign * order,
          lengthMm: p.lengthMm,
          widthMm: i.keepWidth ? W : p.w,
          where: p.where,
          wall: seg.wall,
          y: p.y,
        });
      const u = Math.min(...open.map((p) => p.u));
      const v = Math.max(...open.map((p) => p.v));
      push({ n: counters.k, x: u, w: v - u, kind: "pieces", pieces });
    };
    /** Parts of a split column on the wall: full height, each from its own (narrow) strip. */
    const edgeParts = (parts: ReturnType<typeof partsOf>, joints: number) => {
      for (const p of parts) {
        if (p.kind !== "wall") continue;
        counters.n++;
        // A first strip wrapping back round the corner shows only its part on this wall.
        push({ n: counters.n, x: Math.max(p.u, 0), w: p.v - Math.max(p.u, 0), kind: "edge" });
        out.blanks.push({
          n: counters.n,
          order: sign * order,
          parts: [{ wall: seg.wall, widthMm: p.v - p.u }],
          restMm: W - (p.v - p.u),
        });
      }
      // Each part over an opening is its own pieces column (a strip may cross two openings with wall between).
      for (const p of parts) if (p.b) piecesColumn([{ b: p.b, u: p.u, v: p.v }]);
      out.edges += joints;
    };
    /** What a strip [x0, x0 + W] hung whole over openings leaves when trimmed round them (in from the edges). */
    const cutoutsOf = (x0: number, from: number, to: number) => {
      const x1 = x0 + W;
      const list: HangCutout[] = [];
      for (const b of hitting(from, to))
        for (const it of b.items) {
          const u = Math.max(it.x0, from) + i.marginMm;
          const v = Math.min(it.x1, to) - i.marginMm;
          const top = it.o.y + i.marginMm;
          const bottom = Math.min(it.o.y + it.o.h, i.heightMm) - i.marginMm;
          if (v - u < narrowMm || bottom - top < narrowMm) continue;
          const c = { xMm: seg.mirrored ? x1 - v : u - x0, fromMm: top, lengthMm: bottom - top, widthMm: v - u };
          const overlaps = list.some(
            (d) =>
              d.xMm < c.xMm + c.widthMm &&
              c.xMm < d.xMm + d.widthMm &&
              d.fromMm < c.fromMm + c.lengthMm &&
              c.fromMm < d.fromMm + d.lengthMm,
          );
          if (!overlaps) list.push(c);
        }
      return list;
    };
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
      if (x >= seg.to - EPS) {
        // The rest reached the corner but wraps less than it should: the next wall's strip wraps back.
        if (!last && carry === 0 && over < seg.wrapMm - EPS) short = seg.wrapMm - Math.max(over, 0);
        if (last && over < seg.wrapMm - EPS) shortAtEnd = seg.wrapMm - Math.max(over, 0);
        return;
      }
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
        // Cut at the edges of openings: only up to the corner part, which keeps its wrap and carry.
        let from = Math.max(x, 0);
        let split = false;
        if (edgeCut) {
          const hit = hitting(from, seg.to);
          const parts = hit.length > 0 ? partsOf(hit, from, seg.to) : [];
          const corner = parts[parts.length - 1];
          if (corner?.kind === "wall" && parts.slice(0, -1).every((p) => p.v - p.u >= narrowMm)) {
            edgeParts(parts.slice(0, -1), parts.length - 1);
            from = corner.u;
            split = true;
          }
        }
        counters.n++;
        const n = counters.n;
        const onWall = seg.to - from;
        const wrap = Math.min(seg.wrapMm, W - (seg.to - x));
        if (!last && wrap < seg.wrapMm - EPS) short = seg.wrapMm - wrap;
        if (last && wrap < seg.wrapMm - EPS) shortAtEnd = seg.wrapMm - wrap;
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
        // A split leaves the strip's side before the corner part as a rest (the larger side when both are left).
        const freed = from - Math.max(x, 0);
        if (split) restMm = Math.max(restMm, freed);
        const cutouts = split ? [] : cutoutsOf(x, Math.max(x, 0), seg.to);
        push({ n, x: from, w: onWall, kind: last ? "closing" : "corner" });
        out.blanks.push({ n, order: sign * order, parts, restMm, ...(cutouts.length > 0 ? { cutouts } : {}) });
        order++;
      } else {
        const x0 = x;
        const hit = hitting(x0, x1);
        const single = hit.length === 1 ? hit[0] : undefined;
        // A window or a bare zone at the edge of the opening needs the margin; a door none (casing).
        const m0 = (b: Block) => (b.items.some((it) => it.x0 <= b.x0 + EPS && it.o.type !== "door") ? i.marginMm : 0);
        const m1 = (b: Block) => (b.items.some((it) => it.x1 >= b.x1 - EPS && it.o.type !== "door") ? i.marginMm : 0);
        const parts = edgeCut && hit.length > 0 ? partsOf(hit, x0, x1) : [];
        if (single && single.x0 + m0(single) <= x0 + EPS && x1 <= single.x1 - m1(single) + EPS) {
          piecesColumn([{ b: single, u: x0, v: x1 }]);
        } else if (parts.length > 0 && parts.every((p) => p.v - p.u >= narrowMm)) {
          edgeParts(parts, parts.length - 1);
        } else {
          counters.n++;
          // A first strip wrapping back round the corner shows only its part on this wall.
          push({ n: counters.n, x: Math.max(x, 0), w: x1 - Math.max(x, 0), kind: x < -EPS ? "corner" : "full" });
          const cutouts = cutoutsOf(x0, Math.max(x0, 0), x1);
          out.blanks.push({
            n: counters.n,
            order: sign * order,
            parts: [{ wall: seg.wall, widthMm: W }],
            restMm: 0,
            ...(cutouts.length > 0 ? { cutouts } : {}),
          });
        }
        order++;
      }
      x = x1;
    }
  });
  return shortAtEnd;
}

export function hangStrips(i: HangInput, narrowMm = 100): HangResult {
  const count = i.walls.length;
  const out: HangResult = {
    walls: [],
    blanks: [],
    pieces: [],
    narrow: 0,
    narrowestMm: Number.POSITIVE_INFINITY,
    closingOverlapMm: 0,
    slivers: 0,
    edges: 0,
  };
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

  const ccwRun = ccw.filter((g, j) => j > 0 || g.to - g.from > EPS);
  // Where the anticlockwise side's last strip cannot wrap onto wall c (it ends right at the corner), the clockwise
  // side goes to the corner and wraps onto the next wall instead, so the closing corner is never bare.
  const dry: HangResult = {
    walls: [],
    blanks: [],
    pieces: [],
    narrow: 0,
    narrowestMm: 0,
    closingOverlapMm: 0,
    slivers: 0,
    edges: 0,
  };
  const shortfall = hangRun(
    i,
    ccwRun,
    -1,
    { n: 0, k: 0 },
    dry,
    i.walls.map(() => []),
    i.walls.map(() => []),
    narrowMm,
  );
  if (shortfall > EPS && end) {
    end.to = L(end.wall);
    end.wrapMm = i.wrapsMm[c] ?? 0;
  }
  const counters = { n: 0, k: 0 };
  const cwShort = hangRun(i, cw, 1, counters, out, columns, lines, narrowMm);
  hangRun(i, ccwRun, -1, counters, out, columns, lines, narrowMm);
  const wrapC = i.wrapsMm[c] ?? 0;
  out.closingOverlapMm = wrapC - shortfall + (shortfall > EPS ? wrapC - cwShort : 0);

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
  out.slivers = columns.flat().reduce((n, col) => n + (col.pieces ?? []).filter((p) => p.w < narrowMm - EPS).length, 0);
  return out;
}
