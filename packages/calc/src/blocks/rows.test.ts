import { describe, expect, it } from "vitest";
import { layRows } from "./rows";

const board = { boardLengthMm: 1285, minPieceMm: 300, minOffsetMm: 300 };

describe("layRows", () => {
  it("mockup room: rows of 4580 — 23 rows take 85 boards", () => {
    // Row 1: 1285 + 2 × 1285 + 725 (right part 560 → start pool). Row 2: 560 would end in 165; a whole board
    // repeats the joints — cut 985 (left part 300 → end pool), end 1025 from a new board (300 is too short).
    // Row 3: whole board, end 725 → another 560. The 300 left parts may only END a row, never start one.
    // Hand-checked rows: 985 + 2 + 1025; 425 + 3 + 300 (pooled left part); 725 + 3; whole + 2 + 725 (from 860)…
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 1 }).boards).toBe(4);
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 8 }).boards).toBe(30);
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 23 })).toMatchObject({ boards: 85 });
  });

  it("reuses a row-end offcut to start the next row when the joints stay 300 apart", () => {
    // 1380 boards: row 1 ends 440 (offcut 940), row 2 starts with 940 (joint shift 440).
    const cut = layRows({ rowLengthMm: 4580, rows: 2, boardLengthMm: 1380, minPieceMm: 300, minOffsetMm: 300 });
    expect(cut).toMatchObject({ boards: 7, reusedStarts: 1 });
  });

  it("a row no longer than a board is one piece per row", () => {
    expect(layRows({ ...board, rowLengthMm: 1180, rows: 6 })).toMatchObject({ boards: 6, reusedStarts: 0 });
    expect(layRows({ ...board, rowLengthMm: 600, rows: 4 }).boards).toBe(2);
  });

  it("no rows, no boards", () => {
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 0 })).toMatchObject({ boards: 0, reusedStarts: 0, wasteMm: 0 });
  });
});
