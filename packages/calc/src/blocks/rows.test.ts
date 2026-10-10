import { describe, expect, it } from "vitest";
import { layRows } from "./rows";

const board = { boardLengthMm: 1285, minPieceMm: 300, minOffsetMm: 300 };

describe("layRows", () => {
  it("mockup room: every row of 4580 takes 4 boards; 23 rows take 92", () => {
    // Row 1: 1285 + 2 × 1285 + 725 (right part 560 → start pool). Row 2: 560 would end in 165; a whole board
    // repeats the joints — cut 985 (left part 300 → end pool), end 1025 from a new board (300 is too short).
    // Row 3: whole board, end 725 → another 560. The 300 left parts may only END a row, never start one.
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 1 }).boards).toBe(4);
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 4 }).boards).toBe(16);
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 23 })).toMatchObject({ boards: 92 });
  });

  it("a start-cut leftover is never used to start a row", () => {
    // In the mockup rows the only start-side offcut is 560, which would end the row in a 165 sliver; the 300
    // left parts are end-side only — so no row starts with an offcut.
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 6 }).reusedStarts).toBe(0);
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
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 0 })).toEqual({ boards: 0, reusedStarts: 0, wasteMm: 0 });
  });
});
