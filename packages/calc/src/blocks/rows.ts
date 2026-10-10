/**
 * Boards laid in rows (laminate, parquet board, vinyl planks). Every row is `rowLengthMm` long; it starts with
 * a piece of length `start`, continues with whole boards and ends with a cut piece. The offcut of a row end
 * goes to a pool and may start a later row or cover a later row end. Rules (laying guides): no piece shorter
 * than `minPieceMm`; end joints of neighbouring rows at least `minOffsetMm` apart.
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
  const pool: number[] = [];
  let boards = 0;
  let reusedStarts = 0;
  let wasteMm = 0;

  /** Takes the shortest pooled piece ≥ `length`, else a new board; keeps or wastes the rest. */
  const take = (length: number) => {
    const i = pool.reduce((best, p, k) => (p >= length && (best < 0 || p < (pool[best] as number)) ? k : best), -1);
    const piece = i >= 0 ? (pool.splice(i, 1)[0] as number) : board;
    if (i < 0) boards++;
    const rest = piece - length;
    if (rest >= minPiece) pool.push(rest);
    else wasteMm += rest;
  };

  // A row no longer than a board is a single piece: no joints, no offset rule.
  if (row <= board) {
    for (let r = 0; r < rows; r++) take(row);
    return { boards, reusedStarts, wasteMm: wasteMm + pool.reduce((s, p) => s + p, 0) };
  }

  let previous: number | undefined;
  for (let r = 0; r < rows; r++) {
    const fits = (start: number) =>
      start >= minPiece &&
      start <= board &&
      (previous === undefined || phaseGap(start, previous, board) >= minOffset) &&
      // The row end must not be a sliver either.
      ((row - start) % board === 0 || (row - start) % board >= minPiece);
    // 1) the longest pooled offcut that keeps the joints apart, 2) a whole board, 3) a board cut to shift the joints.
    const offcut = [...pool].sort((a, b) => b - a).find(fits);
    let start: number;
    if (offcut !== undefined) {
      pool.splice(pool.indexOf(offcut), 1);
      start = offcut;
      reusedStarts++;
    } else if (fits(board)) {
      start = board;
      boards++;
    } else {
      const shifted = [previous ?? 0]
        .flatMap((p) => [p - minOffset, p + minOffset, p - board / 2, p + board / 2])
        .map((s) => ((s % board) + board) % board)
        .filter((s) => s > 0)
        .sort((a, b) => b - a);
      start = shifted.find(fits) ?? board;
      take(start);
    }
    const rest = row - start;
    const ends = rest % board;
    boards += Math.floor(rest / board);
    if (ends > 0) take(ends);
    previous = start;
  }
  return { boards, reusedStarts, wasteMm: wasteMm + pool.reduce((s, p) => s + p, 0) };
}
