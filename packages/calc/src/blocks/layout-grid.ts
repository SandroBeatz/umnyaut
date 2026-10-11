import type { LayoutPiece } from "../types";
import { gridLine } from "./grid";

/** One column or row of the grid along a span: where it starts, how wide, whether it is cut. */
export interface GridCell {
  at: number;
  size: number;
  cut: boolean;
}

/**
 * Tile positions along one span, from the very `gridLine` the purchase counts: from a corner, whole tiles from
 * the start wall with joints between them and the cut at the far wall; from the centre, an equal cut at both
 * walls and whole tiles between them.
 */
export function gridCells(spanMm: number, tileMm: number, jointMm: number, start: "corner" | "center"): GridCell[] {
  const line = gridLine(spanMm, tileMm, jointMm, start);
  const pitch = tileMm + jointMm;
  if (line.whole === 0) {
    // One piece, or (from the centre) two cut pieces meeting at a joint in the middle.
    const [a, b] = line.cuts;
    if (a === undefined) return [];
    return b === undefined
      ? [{ at: 0, size: a, cut: true }]
      : [
          { at: 0, size: a, cut: true },
          { at: a + jointMm, size: b, cut: true },
        ];
  }
  const cells: GridCell[] = [];
  const [first, last] = start === "center" && line.cuts.length === 2 ? line.cuts : [undefined, line.cuts[0]];
  let at = 0;
  if (first !== undefined) {
    cells.push({ at: 0, size: first, cut: true });
    at = first + jointMm;
  }
  for (let k = 0; k < line.whole; k++, at += pitch) cells.push({ at, size: tileMm, cut: false });
  if (last !== undefined) cells.push({ at, size: last, cut: true });
  return cells;
}

export interface GridLayoutInput {
  /** Room in the plan frame, mm. */
  lengthMm: number;
  widthMm: number;
  /** Tile along the room length (x) and across (y). */
  tileLengthMm: number;
  tileWidthMm: number;
  jointMm: number;
  start: "corner" | "center";
  /** Start at the right or the bottom wall instead of the left and the top one (corner start). */
  flipX: boolean;
  flipY: boolean;
  /** L-shape cut-out on the plan: tiles wholly inside are dropped, tiles crossing its edge are cut. */
  cutOut?: { x: number; y: number; w: number; h: number };
}

/** Tiles on the plan: the grid of columns × rows, row index along y in laying order. */
export function gridLayout(i: GridLayoutInput): { pieces: LayoutPiece[]; columns: GridCell[]; rows: GridCell[] } {
  const columns = gridCells(i.lengthMm, i.tileLengthMm, i.jointMm, i.start);
  const rows = gridCells(i.widthMm, i.tileWidthMm, i.jointMm, i.start);
  const c = i.cutOut;
  const pieces: LayoutPiece[] = [];
  rows.forEach((row, r) => {
    const y = i.flipY ? i.widthMm - row.at - row.size : row.at;
    for (const col of columns) {
      const x = i.flipX ? i.lengthMm - col.at - col.size : col.at;
      const within = c && x >= c.x && x + col.size <= c.x + c.w && y >= c.y && y + row.size <= c.y + c.h;
      if (within) continue;
      const crosses = c && x < c.x + c.w && x + col.size > c.x && y < c.y + c.h && y + row.size > c.y;
      pieces.push({ x, y, w: col.size, h: row.size, cut: row.cut || col.cut || Boolean(crosses), row: r });
    }
  });
  return { pieces, columns, rows };
}
