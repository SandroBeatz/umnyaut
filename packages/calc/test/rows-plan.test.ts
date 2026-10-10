import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { layRows, type RowsInput } from "../src/blocks/rows";

/**
 * Independent rule check of a laying plan (not the engine's own logic): re-lays every row from the plan and
 * fails on any illegal piece. Locks: a start piece is a board's right part (whole board, a cut board, or a
 * pooled right part used whole); an end piece is a board's left part (a new board or a pooled left part cut
 * down). Every piece ≥ minPiece; end joints of neighbouring rows ≥ minOffset apart; boards counted.
 */
function check(input: RowsInput): string[] {
  const { rowLengthMm: row, boardLengthMm: board, minPieceMm: min, minOffsetMm: offset, rows } = input;
  const result = layRows(input);
  const errors: string[] = [];
  if (row <= board) return errors;
  const plan = result.plan ?? [];
  if (plan.length !== rows) errors.push(`plan has ${plan.length} rows, expected ${rows}`);
  const rights: number[] = [];
  const lefts: number[] = [];
  let boards = 0;
  let previous: number | undefined;
  plan.forEach((r, k) => {
    // A relaxed row (no legal start exists) is only counted, not judged.
    const at = `row ${k + 1}`;
    const err = (e: string) => {
      if (!r.relaxed) err(`${e}`);
    };
    if (r.start < min || r.start > board) err(`start ${r.start} out of range`);
    if (previous !== undefined) {
      const d = Math.abs(r.start - previous) % board;
      if (Math.min(d, board - d) < Math.min(offset, board / 2)) err(`joints ${Math.min(d, board - d)} apart`);
    }
    if (r.startFrom === "pool") {
      const i = rights.indexOf(r.start);
      if (i < 0) err(`no right part ${r.start} in the pool`);
      else rights.splice(i, 1);
    } else {
      boards++;
      if (r.startFrom === "cut" && board - r.start >= min) lefts.push(board - r.start);
    }
    const end = (row - r.start) % board;
    if (end !== r.end) err(`end ${r.end}, geometry says ${end}`);
    if (end > 0 && end < min) err(`end sliver ${end}`);
    boards += Math.floor((row - r.start) / board);
    if (end > 0 && r.endFrom === "pool") {
      const i = lefts.reduce((b, p, j) => (p >= end && (b < 0 || p < (lefts[b] as number)) ? j : b), -1);
      if (i < 0) err(`no left part ≥ ${end} in the pool`);
      else lefts.splice(i, 1);
    } else if (end > 0) {
      boards++;
      if (board - end >= min) rights.push(board - end);
    }
    previous = r.start;
  });
  if (boards !== result.boards) errors.push(`plan needs ${boards} boards, result says ${result.boards}`);
  return errors;
}

describe("layRows plan follows the laying rules", () => {
  it("golden rooms", () => {
    for (const [row, rows, board] of [
      [4580, 23, 1285],
      [4280, 24, 1285],
      [5980, 26, 1285],
      [4580, 23, 1380],
      [2980, 11, 1285],
      [2060, 23, 1285],
      [2075, 11, 1285],
    ] as const) {
      expect(check({ rowLengthMm: row, rows, boardLengthMm: board, minPieceMm: 300, minOffsetMm: 300 })).toEqual([]);
    }
  });

  it("random rooms", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 12_000 }),
        fc.integer({ min: 1, max: 40 }),
        fc.integer({ min: 600, max: 2500 }),
        fc.integer({ min: 150, max: 500 }),
        (row, rows, board, offset) =>
          check({ rowLengthMm: row, rows, boardLengthMm: board, minPieceMm: offset, minOffsetMm: offset }).length === 0,
      ),
      { numRuns: 300 },
    );
  }, 60_000);
});
