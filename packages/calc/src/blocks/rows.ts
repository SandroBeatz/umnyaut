/**
 * Boards laid in rows (laminate, parquet board, vinyl planks). Every row is `rowLengthMm` long; it starts with
 * a piece of length `start`, continues with whole boards and ends with a cut piece. A click board has a lock on
 * each end and cannot be turned round, so offcuts are of two kinds: the right part left after cutting a row end
 * can only START a later row; the left part left after cutting a row start can only END one. Rules (laying
 * guides): no piece shorter than `minPieceMm`; end joints of neighbouring rows at least `minOffsetMm` apart.
 */
export interface RowsInput {
  rowLengthMm: number;
  rows: number;
  boardLengthMm: number;
  /** Shortest piece allowed in a row (also the shortest offcut worth keeping). */
  minPieceMm: number;
  /** Shortest distance between end joints of neighbouring rows. */
  minOffsetMm: number;
}

export interface RowsResult {
  /** Whole boards taken from packs. */
  boards: number;
  /** Row starts that came from an offcut. */
  reusedStarts: number;
  /** Length of board that ends up as waste, mm (pieces too short to reuse and what is left in the pool). */
  wasteMm: number;
}

/** Distance between two joint phases on a board grid, 0 … B/2. */
function phaseGap(a: number, b: number, board: number): number {
  const d = Math.abs(a - b) % board;
  return Math.min(d, board - d);
}

export function layRows(input: RowsInput): RowsResult {
  const board = input.boardLengthMm;
  const row = input.rowLengthMm;
  const rows = Math.max(Math.trunc(input.rows), 0);
  const minPiece = Math.min(input.minPieceMm, board);
  const minOffset = Math.min(input.minOffsetMm, board / 2);
  /** Right parts (from row-end cuts): whole pieces that may start a row. */
  const starts: number[] = [];
  /** Left parts (from row-start cuts): may be cut down to end a row. */
  const ends: number[] = [];
  let boards = 0;
  let reusedStarts = 0;
  let wasteMm = 0;
  const keep = (pool: number[], rest: number) => {
    if (rest >= minPiece) pool.push(rest);
    else wasteMm += rest;
  };

  // A row no longer than a board is a single piece cut at both ends: any offcut long enough will do.
  if (row <= board) {
    const pool = [...starts];
    for (let r = 0; r < rows; r++) {
      const k = pool.reduce((best, p, j) => (p >= row && (best < 0 || p < (pool[best] as number)) ? j : best), -1);
      if (k >= 0) wasteMm += (pool.splice(k, 1)[0] as number) - row;
      else {
        boards++;
        if (board - row >= minPiece) pool.push(board - row);
        else wasteMm += board - row;
      }
    }
    return { boards, reusedStarts, wasteMm: wasteMm + pool.reduce((sum, p) => sum + p, 0) };
  }

  let previous: number | undefined;
  for (let r = 0; r < rows; r++) {
    const fits = (start: number) =>
      start >= minPiece &&
      start <= board &&
      (previous === undefined || phaseGap(start, previous, board) >= minOffset) &&
      // The row end must not be a sliver either.
      ((row - start) % board === 0 || (row - start) % board >= minPiece);
    // 1) the longest start-side offcut that keeps the joints apart, 2) a whole board, 3) a board cut to shift
    // the joints — its left part goes to the end-side pool.
    const offcut = [...starts].sort((x, y) => y - x).find(fits);
    let start: number;
    if (offcut !== undefined) {
      starts.splice(starts.indexOf(offcut), 1);
      start = offcut;
      reusedStarts++;
    } else if (fits(board)) {
      start = board;
      boards++;
    } else {
      const shifted = [previous ?? 0]
        .flatMap((p) => [p - minOffset, p + minOffset, p - board / 2, p + board / 2])
        .map((x) => ((x % board) + board) % board)
        .filter((x) => x > 0)
        .sort((x, y) => y - x);
      start = shifted.find(fits) ?? board;
      boards++;
      keep(ends, board - start);
    }
    const rest = row - start;
    const end = rest % board;
    boards += Math.floor(rest / board);
    if (end > 0) {
      // The shortest end-side piece that is long enough; else a new board, whose right part may start a row.
      const k = ends.reduce((best, p, j) => (p >= end && (best < 0 || p < (ends[best] as number)) ? j : best), -1);
      if (k >= 0) wasteMm += (ends.splice(k, 1)[0] as number) - end;
      else {
        boards++;
        keep(starts, board - end);
      }
    }
    previous = start;
  }
  const left = [...starts, ...ends].reduce((sum, p) => sum + p, 0);
  return { boards, reusedStarts, wasteMm: wasteMm + left };
}
