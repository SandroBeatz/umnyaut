import type { ElevationOpening } from "../types";

/**
 * Wallpaper hung wall by wall (docs/ui/room-plan-and-layout-guides.md, wallpaper). From the start corner the
 * strips go clockwise round the room, each the roll width, butt to the one before. At an inner corner the strip
 * is cut lengthwise so that it wraps `wrapMm` onto the next wall; the rest of that strip goes on the next wall
 * from the corner, overlapping the wrap, its edge set by the level — when it is at least `minCarryMm` wide (a
 * narrower rest is waste and the next wall starts with a new strip). The very first strip wraps onto the last
 * wall the same way, so the last wall ends `wrapMm` short of the start corner. A strip lying wholly across a
 * door or a window is not hung full height: pieces go above it (and below a window) instead; a strip that only
 * partly covers an opening stays full height and is cut round it.
 */
export interface HangWall {
  lengthMm: number;
  /** In the wall's frame: x from its first corner, y down from the ceiling. */
  openings: readonly ElevationOpening[];
}

export interface HangInput {
  /** Walls clockwise, starting with the start wall. */
  walls: readonly HangWall[];
  heightMm: number;
  rollWidthMm: number;
  /** How far a strip wraps round an inner corner. */
  wrapMm: number;
  /** Narrowest rest of a corner strip worth hanging on the next wall. */
  minCarryMm: number;
  /** Shorter gaps above or below an opening are closed by the trim and the casing: no piece. */
  minPieceMm: number;
  /** Trim allowance added to every piece (strips get it in the tool). */
  trimMm: number;
  /**
   * A strip becomes pieces only this far inside a window on both sides, so a 1–2 cm error in placing the window
   * on the plan never leaves a bare edge (a door's casing covers its edge: none there).
   */
  windowMarginMm: number;
}

/** A column of wallpaper on a wall, in hanging order. */
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
   * `full` — a strip floor to ceiling; `corner` — a full strip cut lengthwise at the corner; `carry` — the rest
   * of the corner strip from the wall before; `pieces` — pieces above and below an opening instead of a strip.
   */
  kind: "full" | "corner" | "carry" | "pieces";
  /** Pieces of a `pieces` column: y down from the ceiling, height on the wall, cut length with the trim. */
  pieces?: readonly { y: number; h: number; lengthMm: number; where: "above" | "below" }[];
}

export interface HangedWall {
  columns: HangColumn[];
  /** Where the level line goes: the edge of the first new strip away from the corner, mm from the corner. */
  plumbMm: number;
  /** Width of the corner strip on this wall and its rest on the next one (0 — the rest is waste). */
  cornerMm?: number;
  carryMm?: number;
}

export interface HangResult {
  walls: HangedWall[];
  /** Full-height strips (full and corner columns). */
  strips: number;
  /** Pieces in hanging order, with the number of their pieces column. */
  pieces: { n: number; lengthMm: number; where: "above" | "below"; wall: number }[];
}

const EPS = 1e-6;

export function hangStrips(i: HangInput): HangResult {
  const w = i.rollWidthMm;
  const last = i.walls.length - 1;
  const result: HangResult = { walls: [], strips: 0, pieces: [] };
  let n = 0;
  let k = 0;
  let carry = 0;
  i.walls.forEach((wall, j) => {
    const L = wall.lengthMm;
    const target = j === last ? L - i.wrapMm : L;
    const columns: HangColumn[] = [];
    const hanged: HangedWall = { columns, plumbMm: 0 };
    let x = 0;
    if (j === 0) {
      // The first strip wraps onto the last wall: its edge on this wall is a roll width minus the wrap away.
      x = -i.wrapMm;
    } else if (carry > 0) {
      columns.push({ n, x: 0, w: Math.min(carry, L), kind: "carry" });
      x = carry;
    }
    const nextCarry = carry > L ? carry - L - i.wrapMm : 0;
    carry = nextCarry >= i.minCarryMm ? nextCarry : 0;
    let first = true;
    while (x < target - EPS) {
      const x0 = Math.max(x, 0);
      const x1 = x + w;
      if (first) {
        hanged.plumbMm = x <= 0 ? Math.min(x1, L) : x0;
        first = false;
      }
      if (x1 > L + EPS) {
        // Across the corner: cut lengthwise, the rest goes on the next wall (not past the start corner).
        n++;
        const rest = x1 - L - i.wrapMm;
        if (j < last) carry = rest >= i.minCarryMm ? rest : 0;
        hanged.cornerMm = L - x0;
        hanged.carryMm = j < last ? carry : 0;
        columns.push({ n, x: x0, w: L - x0, kind: "corner" });
        result.strips++;
      } else {
        const over = wall.openings.find((o) => {
          const margin = o.type === "window" ? i.windowMarginMm : 0;
          return o.x + margin <= x0 + EPS && x1 <= o.x + o.w - margin + EPS;
        });
        if (over) {
          k++;
          const pieces: NonNullable<HangColumn["pieces"]>[number][] = [];
          if (over.y >= i.minPieceMm) pieces.push({ y: 0, h: over.y, lengthMm: over.y + i.trimMm, where: "above" });
          const below = i.heightMm - over.y - over.h;
          if (below >= i.minPieceMm)
            pieces.push({ y: over.y + over.h, h: below, lengthMm: below + i.trimMm, where: "below" });
          for (const p of pieces) result.pieces.push({ n: k, lengthMm: p.lengthMm, where: p.where, wall: j });
          columns.push({ n: k, x: x0, w: x1 - x0, kind: "pieces", pieces });
        } else {
          n++;
          columns.push({ n, x: x0, w: x1 - x0, kind: "full" });
          result.strips++;
        }
      }
      x = x1;
    }
    result.walls.push(hanged);
  });
  return result;
}
