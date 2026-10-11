import type { LayoutMark, LayoutPiece, LayoutSheet, PlanWall } from "../types";
import { startOf } from "./plan";

export interface SheetsLayoutInput {
  /** Room in the plan frame, mm. */
  lengthMm: number;
  widthMm: number;
  /** Sheets run along the room length (x) or its width (y). */
  alongLength: boolean;
  rollWidthMm: number;
  /** Neighbouring sheets overlap by this much; the seam is cut in its middle. */
  overlapMm: number;
  /** Extra on each room dimension, split between the two walls and trimmed off. */
  allowanceMm: number;
  /** Cut length of every sheet in laying order, mm, as the purchase counted it. */
  lengthsMm: readonly number[];
  /** Sheets that lie wholly in the narrow part of an L-shape. */
  short: readonly boolean[];
  /** L-shape cut-out in the canonical frame (far end of the sheets, last sheets), along and across the sheets. */
  cut?: { along: number; across: number };
  /** Mirror the canonical layout (start at the top-left) on the plan. */
  flipX: boolean;
  flipY: boolean;
  walls: readonly PlanWall[];
}

/**
 * Sheets and seams on the plan (docs/ui/room-plan-and-layout-guides.md). Canonical frame: u along the sheets
 * from the start wall's corner, v across from the start wall. Sheet j is unrolled at v = −allowance / 2 + j × (roll
 * width − overlap); each seam is cut in the middle of the overlap, so a sheet's floor part runs from its seam to
 * the next one. A sheet is cut (hatched) when it is ripped narrower than a middle sheet or notched by the L-shape.
 */
export function sheetsLayout(i: SheetsLayoutInput): {
  pieces: LayoutPiece[];
  seams: LayoutMark[];
  sheets: LayoutSheet[];
  start: LayoutMark;
  startWall: number;
} {
  const spanU = i.alongLength ? i.lengthMm : i.widthMm;
  const spanV = i.alongLength ? i.widthMm : i.lengthMm;
  const half = i.allowanceMm / 2;
  const step = i.rollWidthMm - i.overlapMm;
  const n = i.lengthsMm.length;
  const toPlan = (u: number, v: number) => {
    let [x, y] = i.alongLength ? [u, v] : [v, u];
    if (i.flipX) x = i.lengthMm - x;
    if (i.flipY) y = i.widthMm - y;
    return [x, y] as const;
  };
  const rect = (u: number, v: number, du: number, dv: number) => {
    const [x1, y1] = toPlan(u, v);
    const [x2, y2] = toPlan(u + du, v + dv);
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
  };
  const inBand = (v: number) => i.cut !== undefined && v > spanV - i.cut.across;
  /** Floor length along the sheets at `v`: the L-shape's narrow part is shorter. */
  const floorAt = (v: number) => (inBand(v) && i.cut ? spanU - i.cut.along : spanU);
  const seamAt = (j: number) => -half + j * step + i.overlapMm / 2;

  const pieces: LayoutPiece[] = [];
  const seams: LayoutMark[] = [];
  const sheets: LayoutSheet[] = [];
  for (let j = 0; j < n; j++) {
    const from = Math.min(Math.max(j === 0 ? 0 : seamAt(j), 0), spanV);
    const to = Math.min(Math.max(j === n - 1 ? spanV : seamAt(j + 1), 0), spanV);
    const floorWidthMm = to - from;
    const short = i.short[j] ?? false;
    sheets.push({ lengthMm: i.lengthsMm[j] ?? 0, floorWidthMm, short });
    if (floorWidthMm <= 0) continue;
    const notched = !short && inBand(to);
    pieces.push({
      ...rect(0, from, short ? floorAt(spanV) : spanU, floorWidthMm),
      cut: floorWidthMm < step - half - 0.5 || notched,
      row: j,
    });
    if (j > 0 && from > 0 && from < spanV) {
      const [x1, y1] = toPlan(0, from);
      const [x2, y2] = toPlan(floorAt(from), from);
      seams.push({ kind: "seam", x1, y1, x2, y2 });
    }
  }
  return { pieces, seams, sheets, ...startOf(i) };
}

/** A seam ending inside a door's opening, where it is walked over most and wears through first. */
export function seamInDoor(seam: LayoutMark, door: LayoutMark): boolean {
  const within = (p: number, a: number, b: number) => p > Math.min(a, b) && p < Math.max(a, b);
  return [
    [seam.x1, seam.y1],
    [seam.x2, seam.y2],
  ].some(([x, y]) =>
    door.y1 === door.y2
      ? Math.abs((y ?? 0) - door.y1) < 1 && within(x ?? 0, door.x1, door.x2)
      : Math.abs((x ?? 0) - door.x1) < 1 && within(y ?? 0, door.y1, door.y2),
  );
}
