/**
 * Boards laid in rows (laminate, parquet board, vinyl planks). Every row is `rowLengthMm` long; it starts with
 * a piece of length `start`, continues with whole boards and ends with a cut piece. A click board has a lock on
 * each end and cannot be turned round, so offcuts are of two kinds: the right part left after cutting a row end
 * can only START a later row; the left part left after cutting a row start can only END one. Rules (laying
 * guides): no piece shorter than `minPieceMm`; end joints of neighbouring rows at least `minOffsetMm` apart.
 * The choice of each row's start is searched over a small beam of states, so a cut that pays off rows later
 * is kept (a row-by-row greedy bought up to 18 % more); test/rows-plan.test.ts re-checks every plan.
 */
export interface RowsInput {
  rowLengthMm: number;
  rows: number;
  /** Rows of different lengths, laid in this order (an L-shaped room); overrides `rowLengthMm` × `rows`. */
  rowLengthsMm?: readonly number[];
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
  /** Per row: start piece and where it came from, end piece and where it came from (for checks and the scheme). */
  plan?: RowPlan[];
}

export interface RowPlan {
  start: number;
  /** `pool` — a start-side offcut; `end-pool` — an end-side piece used for a one-piece row. */
  startFrom: "pool" | "end-pool" | "whole" | "cut";
  end: number;
  endFrom: "pool" | "new" | "none";
  /** No start met the rules (row too short for them): laid from a whole board anyway. */
  relaxed?: true;
}

/** Distance between two joint phases on a board grid, 0 … B/2. */
function phaseGap(a: number, b: number, board: number): number {
  const d = Math.abs(a - b) % board;
  return Math.min(d, board - d);
}

/** Laying state after some rows: boards bought, the previous row's start, the two offcut pools. */
interface State {
  boards: number;
  reusedStarts: number;
  wasteMm: number;
  previous: number | undefined;
  /** Right parts (from row-end cuts): whole pieces that may start a row. */
  starts: number[];
  /** Left parts (from row-start cuts): may be cut down to end a row. */
  ends: number[];
  /** The rows laid so far, newest first, as a shared chain (copying arrays per step is quadratic). */
  plan: PlanLink | undefined;
}

interface PlanLink {
  row: RowPlan;
  previous: PlanLink | undefined;
}

const unroll = (link: PlanLink | undefined): RowPlan[] => {
  const rows: RowPlan[] = [];
  for (let l = link; l; l = l.previous) rows.push(l.row);
  return rows.reverse();
};

/** States kept per row: the cheapest few, so a choice that pays off a few rows later is not lost. */
const BEAM = 24;
/** Offcuts kept per pool; more are counted as waste (safe side) so the search stays fast on huge rooms. */
const POOL = 8;

export function layRows(input: RowsInput): RowsResult {
  const board = Math.round(input.boardLengthMm);
  const lengths = (
    input.rowLengthsMm ?? Array.from({ length: Math.max(Math.trunc(input.rows), 0) }, () => input.rowLengthMm)
  ).map((l) => Math.round(l));
  const minPiece = Math.min(input.minPieceMm, board);
  const minOffset = Math.min(input.minOffsetMm, Math.floor(board / 2));

  const endOf = (row: number, start: number) => (row - start) % board;
  const fits = (row: number, start: number, previous: number | undefined) =>
    start >= minPiece &&
    start <= board &&
    (previous === undefined || phaseGap(start, previous, board) >= minOffset) &&
    // The row end must not be a sliver either.
    (endOf(row, start) === 0 || endOf(row, start) >= minPiece);

  const copy = (st: State, previous: number | undefined): State => ({
    ...st,
    starts: [...st.starts],
    ends: [...st.ends],
    previous,
  });

  /** A row no longer than a board: one piece cut at both ends, no joints — any offcut long enough will do. */
  const single = (st: State, row: number): State[] => {
    const out: State[] = [];
    for (const [pool, from] of [
      ["starts", "pool"],
      ["ends", "end-pool"],
    ] as const) {
      const k = st[pool].reduce((b, p, j) => (p >= row && (b < 0 || p < (st[pool][b] as number)) ? j : b), -1);
      if (k < 0) continue;
      const next = copy(st, undefined);
      // Cut from the piece's sawn end: the rest keeps its lock and goes back to the same pool.
      const rest = (next[pool].splice(k, 1)[0] as number) - row;
      if (rest >= minPiece) next[pool].push(rest);
      else next.wasteMm += rest;
      next.plan = { row: { start: row, startFrom: from, end: 0, endFrom: "none" }, previous: st.plan };
      out.push(next);
    }
    const next = copy(st, undefined);
    next.boards++;
    if (board - row >= minPiece && next.starts.length < POOL) next.starts.push(board - row);
    else next.wasteMm += board - row;
    next.plan = { row: { start: row, startFrom: "whole", end: 0, endFrom: "none" }, previous: st.plan };
    out.push(next);
    return out;
  };

  /** Lays one row from a state with a given start. */
  const lay = (st: State, row: number, start: number, source: "pool" | "whole" | "cut"): State => {
    const next = copy(st, start);
    let endFrom: RowPlan["endFrom"] = "none";
    const keep = (pool: number[], rest: number) => {
      if (rest >= minPiece && pool.length < POOL) pool.push(rest);
      else next.wasteMm += rest;
    };
    if (source === "pool") {
      next.starts.splice(next.starts.indexOf(start), 1);
      next.reusedStarts++;
    } else {
      next.boards++;
      // A board cut for a row start: its left part may end a later row.
      if (source === "cut") keep(next.ends, board - start);
    }
    next.boards += Math.floor((row - start) / board);
    const end = endOf(row, start);
    if (end > 0) {
      // The shortest end-side piece that is long enough; else a new board, whose right part may start a row.
      const k = next.ends.reduce((b, p, j) => (p >= end && (b < 0 || p < (next.ends[b] as number)) ? j : b), -1);
      if (k >= 0) {
        next.wasteMm += (next.ends.splice(k, 1)[0] as number) - end;
        endFrom = "pool";
      } else {
        next.boards++;
        keep(next.starts, board - end);
        endFrom = "new";
      }
    }
    next.plan = { row: { start, startFrom: source, end, endFrom }, previous: st.plan };
    return next;
  };

  /** Candidate starts: pooled offcuts, a whole board, and cuts that shift the joints or match a pooled end. */
  const moves = (st: State, row: number): State[] => {
    if (row <= board) return single(st, row);
    const out: State[] = [];
    for (const p of new Set(st.starts)) if (fits(row, p, st.previous)) out.push(lay(st, row, p, "pool"));
    if (fits(row, board, st.previous)) out.push(lay(st, row, board, "whole"));
    const p = st.previous ?? 0;
    const cuts = new Set<number>([
      p - minOffset,
      p + minOffset,
      p + Math.floor(board / 2),
      p - Math.floor(board / 2),
      minPiece,
      board - minPiece,
      // A start whose row end is exactly a pooled end-side piece.
      ...st.ends.map((e) => row - e),
      row - (board - minPiece),
    ]);
    for (const raw of cuts) {
      const c = ((Math.round(raw) % board) + board) % board;
      if (c > 0 && c < board && fits(row, c, st.previous)) out.push(lay(st, row, c, "cut"));
    }
    return out;
  };

  const sum = (pool: number[]) => pool.reduce((a, b) => a + b, 0);
  const key = (st: State) => `${st.previous}|${[...st.starts].sort().join(",")}|${[...st.ends].sort().join(",")}`;
  let beam: State[] = [
    { boards: 0, reusedStarts: 0, wasteMm: 0, previous: undefined, starts: [], ends: [], plan: undefined },
  ];
  for (const row of lengths) {
    const seen = new Map<string, State>();
    for (const st of beam) {
      for (const next of moves(st, row)) {
        const k = key(next);
        const old = seen.get(k);
        if (!old || next.boards < old.boards) seen.set(k, next);
      }
    }
    // No legal start at all (rules too strict for this row): a whole board anyway, marked relaxed.
    if (seen.size === 0) {
      for (const st of beam) {
        const next = lay(st, row, board, "whole");
        if (next.plan) next.plan.row.relaxed = true;
        seen.set(key(next), next);
      }
    }
    // Fewest boards; then more reusable length in the pools.
    beam = [...seen.values()]
      .sort((a, b) => a.boards - b.boards || sum(b.starts) + sum(b.ends) - (sum(a.starts) + sum(a.ends)))
      .slice(0, BEAM);
  }
  const best = beam[0] as State;
  return {
    boards: best.boards,
    reusedStarts: best.reusedStarts,
    wasteMm: best.wasteMm + sum(best.starts) + sum(best.ends),
    plan: unroll(best.plan),
  };
}
