import { describe, expect, it } from "vitest";
import { layRows } from "./rows";

const board = { boardLengthMm: 1285, minPieceMm: 300, minOffsetMm: 300 };

describe("layRows", () => {
  it("mockup room: rows of 4580 repeat as 4 + 3 + 4 boards; 23 rows take 85 boards", () => {
    // Row 1: 1285 + 2 × 1285 + 725 (offcut 560 kept). Row 2: 560 would leave a 165 end — start 985 (offcut 300),
    // end 1025 from a new board. Row 3: starts with 300, ends with 425 cut from 560. Row 4 = row 1.
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 1 }).boards).toBe(4);
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 4 }).boards).toBe(4 + 4 + 3 + 4);
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
    expect(layRows({ ...board, rowLengthMm: 4580, rows: 0 })).toEqual({ boards: 0, reusedStarts: 0, wasteMm: 0 });
  });
});
