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

/**
 * Shortest plinth piece cut into a run, mm: a shorter one is hard to fix and breaks off at the joint (fitters'
 * practice, unconfirmed — master review C10). A run shorter than this (between a door and a corner) is one piece.
 */
export const MIN_PLINTH_PIECE_MM = 300;

type RunPiece = LayoutRun["pieces"][number];

export interface RunsPlan {
  /** Pieces of each run in laying order and what is left of the last plank after it. */
  runs: { lengthMm: number; pieces: RunPiece[]; carryMm: number }[];
  planks: number;
  /** Joints in the middle of a run, one connector each; a plank ending in a corner or at a door needs none. */
  joints: number;
  /** The longest offcut left unused: the last plank's rest, or a rest put aside because it fitted no run. */
  leftoverMm: number;
}

/**
 * Cut plan for runs laid one after another as a ribbon: what is left of a plank at a corner or a door starts the
 * next run when it is at least `minPieceMm` long (or covers that run whole). No piece shorter than `minPieceMm`
 * is cut into a run: when the last piece would be shorter, the plank before it is cut shorter (its offcut is
 * waste), or the rest it starts from is shortened, or the rest is put aside and the run starts from a new plank.
 */
export function planRuns(lengths: readonly number[], plankMm: number, minPieceMm = MIN_PLINTH_PIECE_MM): RunsPlan {
  const plank = Math.round(plankMm);
  const min = Math.min(minPieceMm, plank);
  let planks = 0;
  let joints = 0;
  let left = 0;
  let aside = 0;
  const runs: RunsPlan["runs"] = [];
  /** New planks for `rest` mm: whole ones and the last cut; a too short last piece takes from the one before. */
  const fresh = (rest: number) => {
    const n = Math.max(Math.ceil(rest / plank - 1e-9), 1);
    const list = Array.from({ length: n }, (_, k) => (k < n - 1 ? plank : rest - (n - 1) * plank));
    const last = list[n - 1] as number;
    if (n >= 2 && last < min) {
      list[n - 2] = plank - (min - last);
      list[n - 1] = min;
    }
    return list;
  };
  for (const L of lengths) {
    const pieces: RunPiece[] = [];
    if (left >= L) {
      pieces.push({ lengthMm: L, plank: planks, from: "rest" });
      left -= L;
      runs.push({ lengthMm: L, pieces, carryMm: left });
      continue;
    }
    let rest = left >= min ? left : 0;
    let tail = fresh(L - rest);
    const last = tail[tail.length - 1] as number;
    if (rest > 0 && tail.length === 1 && last < min) {
      if (rest - (min - last) >= min) {
        rest -= min - last;
        tail = [min];
      } else {
        rest = 0;
        tail = fresh(L);
      }
    }
    aside = Math.max(aside, left - rest);
    if (rest > 0) pieces.push({ lengthMm: rest, plank: planks, from: "rest" });
    for (const len of tail) {
      planks++;
      pieces.push({ lengthMm: len, plank: planks, from: len < plank ? "cut" : "whole" });
    }
    left = plank - (tail[tail.length - 1] as number);
    joints += pieces.length - 1;
    runs.push({ lengthMm: L, pieces, carryMm: left });
  }
  return { runs, planks, joints, leftoverMm: Math.max(left, aside) };
}

/** Runs in laying order: from the longest one, then on round the room. */
export function fromLongest<T>(list: readonly T[], length: (t: T) => number): T[] {
  const first = list.reduce((b, s, k) => (length(s) > length(list[b] as T) ? k : b), 0);
  return [...list.slice(first), ...list.slice(0, first)];
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
 * as one ribbon by `planRuns` — the plan the purchase counts once every door is placed, so the planks and joints
 * of the scheme are those bought.
 */
export function runsLayout(i: RunsLayoutInput): {
  runs: LayoutRun[];
  pieces: LayoutPiece[];
  joints: LayoutMark[];
  start: LayoutMark;
  startWall: number;
  plan: RunsPlan;
  /** Corners with plinth on both sides (no door right at it), as the index of the wall ending there. */
  corners: number[];
} {
  const spans = wallRuns(i.walls, i.placed);
  const ordered = fromLongest(spans, (s) => s.to - s.from);
  const plan = planRuns(
    ordered.map((s) => s.to - s.from),
    i.plankLengthMm,
  );
  const t = i.thicknessMm;
  const runs: LayoutRun[] = [];
  const pieces: LayoutPiece[] = [];
  const joints: LayoutMark[] = [];

  ordered.forEach((span, k) => {
    const w = i.walls[span.wall] as PlanWall;
    const ux = Math.sign(w.x2 - w.x1);
    const uy = Math.sign(w.y2 - w.y1);
    // Inside is to the right of a clockwise wall in the plan frame (y down).
    const nx = -uy;
    const ny = ux;
    const at = (d: number) => [w.x1 + ux * d, w.y1 + uy * d] as const;
    const planned = plan.runs[k] as RunsPlan["runs"][number];
    let d = span.from;
    for (const p of planned.pieces) {
      const [x1, y1] = at(d);
      const [x2, y2] = at(d + p.lengthMm);
      const [x3, y3] = [x2 + nx * t, y2 + ny * t];
      pieces.push({
        x: Math.min(x1, x3),
        y: Math.min(y1, y3),
        w: Math.abs(x3 - x1),
        h: Math.abs(y3 - y1),
        cut: p.from !== "whole",
        reused: p.from === "rest" || undefined,
        row: k,
      });
      if (d > span.from) joints.push({ kind: "seam", x1, y1, x2: x1 + nx * t * 2, y2: y1 + ny * t * 2 });
      d += p.lengthMm;
    }
    runs.push({ wall: span.wall, lengthMm: span.to - span.from, pieces: planned.pieces, carryMm: planned.carryMm });
  });

  // The end of wall k is a plinth corner when a run ends there and the next wall's run starts there.
  const count = i.walls.length;
  const corners = i.walls
    .map((_, k) => k)
    .filter((k) => {
      const length = (i.walls[k] as PlanWall).lengthMm;
      const ends = spans.some((s) => s.wall === k && s.to >= length);
      const starts = spans.some((s) => s.wall === (k + 1) % count && s.from <= 0);
      return ends && starts;
    });

  const s0 = ordered[0];
  const w0 = s0 ? i.walls[s0.wall] : undefined;
  const ux = w0 ? Math.sign(w0.x2 - w0.x1) : 1;
  const uy = w0 ? Math.sign(w0.y2 - w0.y1) : 0;
  const x0 = (w0?.x1 ?? 0) + ux * (s0?.from ?? 0);
  const y0 = (w0?.y1 ?? 0) + uy * (s0?.from ?? 0);
  const reach = Math.min(((s0?.to ?? 0) - (s0?.from ?? 0)) / 3, 1000);
  const start: LayoutMark = { kind: "start", x1: x0, y1: y0, x2: x0 + ux * reach, y2: y0 + uy * reach };
  return { runs, pieces, joints, start, startWall: s0?.wall ?? 0, plan, corners };
}
