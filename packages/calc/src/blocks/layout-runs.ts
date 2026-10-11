import type { LayoutMark, LayoutPiece, LayoutRun, PlanWall } from "../types";
import type { PlacedOpening } from "./plan";

interface Span {
  wall: number;
  /** From and to along the wall, mm from its first corner (clockwise). */
  from: number;
  to: number;
}

/** The straight runs along the walls, clockwise: every wall split by the doors placed on it. */
export function wallRuns(walls: readonly PlanWall[], placed: readonly PlacedOpening[]): Span[] {
  return walls.flatMap((w, k) => {
    const doors = placed
      .filter((p) => p.type === "door" && p.wall === k)
      .map((p) => {
        const a = Math.abs(p.mark.x1 - w.x1) + Math.abs(p.mark.y1 - w.y1);
        return [a, a + p.widthMm] as const;
      })
      .sort((a, b) => a[0] - b[0]);
    const spans: Span[] = [];
    let at = 0;
    for (const [a, b] of doors) {
      if (a > at) spans.push({ wall: k, from: at, to: a });
      at = Math.max(at, b);
    }
    if (w.lengthMm > at) spans.push({ wall: k, from: at, to: w.lengthMm });
    return spans;
  });
}

export interface RunsLayoutInput {
  walls: readonly PlanWall[];
  placed: readonly PlacedOpening[];
  plankLengthMm: number;
  /** Strip width the scheme draws the plinth with, mm. */
  thicknessMm: number;
}

/**
 * Plinth along the outline (docs/ui/room-plan-and-layout-guides.md): from the longest run clockwise, planks laid
 * as one ribbon — what is left of a plank at a corner or a door starts the next run, joined mid-run by a
 * connector. That is the purchase model (planks = ⌈run / plank⌉, joiners = planks − 1), so the plank count of
 * the scheme equals the purchase whenever every door is placed.
 */
export function runsLayout(i: RunsLayoutInput): {
  runs: LayoutRun[];
  pieces: LayoutPiece[];
  joints: LayoutMark[];
  start: LayoutMark;
  startWall: number;
  planks: number;
} {
  const spans = wallRuns(i.walls, i.placed);
  const first = spans.reduce((b, s, k) => (s.to - s.from > (spans[b] as Span).to - (spans[b] as Span).from ? k : b), 0);
  const ordered = [...spans.slice(first), ...spans.slice(0, first)];
  const plank = Math.round(i.plankLengthMm);
  const t = i.thicknessMm;
  const runs: LayoutRun[] = [];
  const pieces: LayoutPiece[] = [];
  const joints: LayoutMark[] = [];
  let planks = 0;
  let left = 0;

  ordered.forEach((span, k) => {
    const w = i.walls[span.wall] as PlanWall;
    const ux = Math.sign(w.x2 - w.x1);
    const uy = Math.sign(w.y2 - w.y1);
    // Inside is to the right of a clockwise wall in the plan frame (y down).
    const nx = -uy;
    const ny = ux;
    const at = (d: number) => [w.x1 + ux * d, w.y1 + uy * d] as const;
    const run: LayoutRun = { wall: span.wall, lengthMm: span.to - span.from, pieces: [], carryMm: 0 };
    const list: LayoutRun["pieces"][number][] = [];
    let d = span.from;
    while (d < span.to) {
      const rest = left > 0;
      if (!rest) {
        planks++;
        left = plank;
      }
      const len = Math.min(left, span.to - d);
      list.push({ lengthMm: len, plank: planks, from: rest ? "rest" : len < plank ? "cut" : "whole" });
      const [x1, y1] = at(d);
      const [x2, y2] = at(d + len);
      const [x3, y3] = [x2 + nx * t, y2 + ny * t];
      pieces.push({
        x: Math.min(x1, x3),
        y: Math.min(y1, y3),
        w: Math.abs(x3 - x1),
        h: Math.abs(y3 - y1),
        cut: len < plank,
        reused: rest || undefined,
        row: k,
      });
      if (d > span.from) joints.push({ kind: "seam", x1, y1, x2: x1 + nx * t * 2, y2: y1 + ny * t * 2 });
      d += len;
      left -= len;
    }
    run.carryMm = left;
    runs.push({ ...run, pieces: list });
  });

  const s0 = ordered[0];
  const w0 = s0 ? i.walls[s0.wall] : undefined;
  const ux = w0 ? Math.sign(w0.x2 - w0.x1) : 1;
  const uy = w0 ? Math.sign(w0.y2 - w0.y1) : 0;
  const x0 = (w0?.x1 ?? 0) + ux * (s0?.from ?? 0);
  const y0 = (w0?.y1 ?? 0) + uy * (s0?.from ?? 0);
  const reach = Math.min(((s0?.to ?? 0) - (s0?.from ?? 0)) / 3, 1000);
  const start: LayoutMark = { kind: "start", x1: x0, y1: y0, x2: x0 + ux * reach, y2: y0 + uy * reach };
  return { runs, pieces, joints, start, startWall: s0?.wall ?? 0, planks };
}
