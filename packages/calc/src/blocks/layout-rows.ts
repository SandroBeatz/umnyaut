import type { LayoutMark, LayoutPiece, LayoutRow, PlanWall } from "../types";
import { POOL, type RowPlan } from "./rows";

/**
 * Turns a `layRows` plan into what the scheme draws and the cut list says (docs/ui/room-plan-and-layout-guides.md).
 * The plan keeps only lengths; where each offcut came from is found by replaying the engine's pools in the
 * plan's order with the engine's own rules (pool cap, shortest piece long enough). The replay counts boards
 * too: it must give the engine's number, so the picture can never disagree with the purchase.
 */
export function traceRows(
  plan: readonly RowPlan[],
  lengthsMm: readonly number[],
  boardLengthMm: number,
  minPieceMm: number,
): { rows: LayoutRow[]; boards: number } {
  const board = Math.round(boardLengthMm);
  const minPiece = Math.min(minPieceMm, board);
  interface Piece {
    len: number;
    row: number;
    /** Left part of a start cut (true) or right part of an end cut / single row (false). */
    left: boolean;
  }
  const starts: Piece[] = [];
  const ends: Piece[] = [];
  const rows: LayoutRow[] = [];
  let boards = 0;

  const keep = (pool: Piece[], piece: Piece, capped = true) => {
    if (piece.len >= minPiece && (!capped || pool.length < POOL)) pool.push(piece);
  };
  /** The shortest piece at least `len` long (first of equals, as the engine picks it). */
  const take = (pool: Piece[], len: number) => {
    const k = pool.reduce((b, p, j) => (p.len >= len && (b < 0 || p.len < (pool[b] as Piece).len) ? j : b), -1);
    return k < 0 ? undefined : (pool.splice(k, 1)[0] as Piece);
  };
  /** Records that a piece from row `from` went on in row `to`. */
  const used = (piece: Piece, to: number) => {
    const origin = rows[piece.row];
    if (!origin) return;
    if (piece.left && origin.startRestToRow === undefined) origin.startRestToRow = to;
    if (!piece.left && origin.restToRow === undefined) origin.restToRow = to;
  };

  plan.forEach((r, k) => {
    const length = Math.round(lengthsMm[k] ?? 0);
    const row: LayoutRow = {
      lengthMm: length,
      widthMm: 0,
      start: r.start,
      startFrom: "whole",
      whole: 0,
      end: r.end,
      endFrom: r.endFrom,
    };
    rows.push(row);
    if (length <= board) {
      // One piece: from an offcut long enough (its rest keeps its lock and goes back), or a new board.
      const pool = r.startFrom === "pool" ? starts : r.startFrom === "end-pool" ? ends : undefined;
      const piece = pool && take(pool, length);
      if (pool && piece) {
        row.startFrom = "pool";
        row.startFromRow = piece.row;
        used(piece, k);
        keep(pool, { ...piece, len: piece.len - length }, false);
      } else {
        boards++;
        row.startFrom = length === board ? "whole" : "cut";
        if (length < board) {
          row.rest = board - length;
          keep(starts, { len: board - length, row: k, left: false });
        }
      }
      return;
    }
    if (r.startFrom === "pool") {
      const i = starts.findIndex((p) => p.len === r.start);
      const piece = i >= 0 ? (starts.splice(i, 1)[0] as Piece) : undefined;
      row.startFrom = "pool";
      if (piece) {
        row.startFromRow = piece.row;
        used(piece, k);
      }
    } else {
      boards++;
      row.startFrom = r.startFrom === "cut" ? "cut" : "whole";
      if (r.startFrom === "cut") {
        row.startRest = board - r.start;
        keep(ends, { len: board - r.start, row: k, left: true });
      }
    }
    row.whole = Math.floor((length - r.start) / board);
    boards += row.whole;
    if (r.end > 0) {
      if (r.endFrom === "pool") {
        const piece = take(ends, r.end);
        if (piece) {
          row.endFromRow = piece.row;
          used(piece, k);
        }
      } else {
        boards++;
        row.rest = board - r.end;
        keep(starts, { len: board - r.end, row: k, left: false });
      }
    }
  });
  return { rows, boards };
}

export interface RowsLayoutInput {
  /** Room in the plan frame, mm. */
  lengthMm: number;
  widthMm: number;
  /** Rows run along the room length (x) or its width (y). */
  alongLength: boolean;
  gapMm: number;
  boardLengthMm: number;
  boardWidthMm: number;
  /** Width of the last row across, mm. */
  lastRowMm: number;
  rows: readonly LayoutRow[];
  /** L-shape cut-out in the canonical frame (far end of the rows, last rows), along and across the rows. */
  cut?: { along: number; across: number };
  /** Mirror the canonical layout (start at the top-left) on the plan. */
  flipX: boolean;
  flipY: boolean;
  walls: readonly PlanWall[];
}

/**
 * Pieces on the plan. Canonical frame: u along the rows from the start wall's corner, v across from the start
 * wall; row k at v = gap + k × board width; the last row is `lastRowMm` wide. A piece is cut when it is shorter
 * than a board, ripped (last row narrower than a board) or notched by the L-shape's corner.
 */
export function rowsLayout(i: RowsLayoutInput): {
  pieces: LayoutPiece[];
  start: LayoutMark;
  startWall: number;
} {
  const spanU = i.alongLength ? i.lengthMm : i.widthMm;
  const spanV = i.alongLength ? i.widthMm : i.lengthMm;
  const pieces: LayoutPiece[] = [];
  const toPlan = (u: number, v: number, du: number, dv: number) => {
    let [x, y, w, h] = i.alongLength ? [u, v, du, dv] : [v, u, dv, du];
    if (i.flipX) x = i.lengthMm - x - w;
    if (i.flipY) y = i.widthMm - y - h;
    return { x, y, w, h };
  };
  const last = i.rows.length - 1;
  i.rows.forEach((row, k) => {
    const v = i.gapMm + k * i.boardWidthMm;
    const dv = k === last ? i.lastRowMm : i.boardWidthMm;
    const ripped = dv < i.boardWidthMm;
    const notched = (u: number, du: number) =>
      i.cut !== undefined && v + dv > spanV - i.cut.across && u + du > spanU - i.cut.along;
    const put = (u: number, du: number, cut: boolean, reused: boolean) => {
      pieces.push({
        ...toPlan(u, v, du, dv),
        cut: cut || ripped || notched(u, du),
        reused: reused || undefined,
        row: k,
      });
    };
    // Start piece (a one-piece row is just this), whole boards, end piece.
    let u = i.gapMm;
    put(u, row.start, row.startFrom !== "whole", row.startFrom === "pool");
    u += row.start;
    for (let n = 0; n < row.whole; n++, u += i.boardLengthMm) put(u, i.boardLengthMm, false, false);
    if (row.end > 0) put(u, row.end, true, row.endFrom === "pool");
  });

  const cornerX = i.flipX ? i.lengthMm : 0;
  const cornerY = i.flipY ? i.widthMm : 0;
  const reach = Math.min(spanU / 3, 1000);
  const dirX = i.alongLength ? (i.flipX ? -1 : 1) : 0;
  const dirY = i.alongLength ? 0 : i.flipY ? -1 : 1;
  const start: LayoutMark = {
    kind: "start",
    x1: cornerX,
    y1: cornerY,
    x2: cornerX + dirX * reach,
    y2: cornerY + dirY * reach,
  };
  // The start wall runs along the rows through the start corner.
  const side = i.alongLength ? (i.flipY ? "bottom" : "top") : i.flipX ? "right" : "left";
  const on = (w: PlanWall) => (w.x1 === cornerX && w.y1 === cornerY) || (w.x2 === cornerX && w.y2 === cornerY);
  const startWall = Math.max(
    i.walls.findIndex((w) => w.side === side && on(w)),
    0,
  );
  return { pieces, start, startWall };
}
