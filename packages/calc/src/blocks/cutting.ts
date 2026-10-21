/**
 * Cutting plan for rolls (wallpaper): full-length strips are cut from the rolls, each where its pattern lines up —
 * either in hanging order from one roll, or (offset match) every pattern phase from its own roll, as fitters cut
 * a drop match from two rolls alternately so no half repeat is lost between strips; then shorter or narrower parts (pieces above and below openings, narrow closing strips) go
 * into the material already left over — roll tails and the side rests of strips cut lengthwise — and a new roll
 * is opened only when no rest fits. Every rest is a rectangle in its roll; a part taken from it splits it across
 * (guillotine): the rest along the roll keeps the full rest width, the rest beside the part keeps the part's
 * length. What is trimmed off a strip hung whole over a door or a window is a rest too. A rest is used once. Several part orders and fit rules are tried; the plan with the fewest rolls wins,
 * then the one leaving the largest reusable rest. Areas are exact: used + reusable rests + waste = rolls bought.
 */
export interface CutPlanInput {
  rollWidthMm: number;
  rollLengthMm: number;
  /** Pattern repeat; 0 — no pattern to match (any part may take any rest). */
  repeatMm: number;
  /** Best case: every roll starts right at the pattern (no lead lost). */
  luckyStart?: boolean;
  /**
   * Full-length strips in hanging order: length, pattern phase (mm into the repeat), width left after cutting it
   * lengthwise, and what is trimmed off it over openings (across from its left edge, along from its top).
   */
  strips: readonly {
    lengthMm: number;
    phaseMm: number;
    restMm: number;
    cutouts?: readonly { xMm: number; fromMm: number; lengthMm: number; widthMm: number }[];
  }[];
  /** Smaller parts: width (≤ roll width), length, pattern phase. */
  parts: readonly { widthMm: number; lengthMm: number; phaseMm: number }[];
  /** Rests narrower or shorter than this are waste. */
  minRestMm: number;
  /** One order and fit rule only (a quick estimate while comparing starts). */
  quick?: boolean;
}

export interface PlannedCut {
  kind: "strip" | "part";
  /** Index in `strips` or `parts`. */
  index: number;
  /** Along the roll from its usable start, and across it from the left edge, mm. */
  fromMm: number;
  lengthMm: number;
  xMm: number;
  widthMm: number;
  /** Cut from material left over from an earlier cut (a tail or a side rest), not from a fresh roll. */
  fromRest: boolean;
  /** Cut from what was trimmed off a strip over an opening. */
  fromCutout?: boolean;
}

export interface PlannedRest {
  fromMm: number;
  lengthMm: number;
  xMm: number;
  widthMm: number;
}

export interface PlannedRoll {
  cuts: PlannedCut[];
  /** Reusable rests left (both sides at least `minRestMm`). */
  rests: PlannedRest[];
  usedM2: number;
  restM2: number;
  wasteM2: number;
}

export interface CutPlan {
  fits: boolean;
  tooLong?: "strip" | "part";
  rolls: PlannedRoll[];
  /** Full strips a fresh roll gives (for the steps). */
  perRoll: number;
  /** What a fresh roll leaves after those strips, mm. */
  perRollSlackMm: number;
  /** Longest full-width rest at the end of a roll, mm (the leftover the purchase reports). */
  tailMm: number;
}

const EPS = 1e-6;

interface Rest extends PlannedRest {
  roll: number;
  cutout?: boolean;
}

interface RollState {
  /** Pattern phase at the roll's usable start. */
  base: number;
  end: number;
  cuts: PlannedCut[];
  /** Area trimmed off strips over openings, mm² (not used by the strip: a rest, a part or waste). */
  trimmed: number;
}

function plan(i: CutPlanInput, order: number[], best: boolean, grouped: boolean): CutPlan {
  const W = i.rollWidthMm;
  const repeat = Math.max(i.repeatMm, 0);
  const usable = i.rollLengthMm - (repeat > 0 && !i.luckyStart ? repeat - 1 : 0);
  const wrap = (v: number) => (repeat > 0 ? ((v % repeat) + repeat) % repeat : 0);
  /** First position ≥ `pos` in a roll with `base` where the pattern is at `phase`. */
  const at = (pos: number, base: number, phase: number) => {
    if (repeat <= 0) return pos;
    const local = wrap(phase - base);
    return local + Math.max(Math.ceil((pos - local) / repeat - EPS), 0) * repeat;
  };

  const rolls: RollState[] = [];
  const rests: Rest[] = [];
  /** Grouped: the roll strips of each pattern phase are cut from now. */
  const open = new Map<number, number>();
  i.strips.forEach((s, index) => {
    let roll = grouped ? (open.get(wrap(s.phaseMm)) ?? -1) : rolls.length - 1;
    const last = rolls[roll];
    let from = last ? at(last.end, last.base, s.phaseMm) : Number.POSITIVE_INFINITY;
    if (!last || from + s.lengthMm > usable + EPS) {
      rolls.push({ base: wrap(s.phaseMm), end: 0, cuts: [], trimmed: 0 });
      roll = rolls.length - 1;
      from = 0;
    }
    open.set(wrap(s.phaseMm), roll);
    const r = rolls[roll] as RollState;
    // Cut lengthwise: the strip uses its parts; the width left is a rest (or waste when too narrow).
    r.cuts.push({
      kind: "strip",
      index,
      fromMm: from,
      lengthMm: s.lengthMm,
      xMm: 0,
      widthMm: W - s.restMm,
      fromRest: false,
    });
    r.end = from + s.lengthMm;
    if (s.restMm >= i.minRestMm)
      rests.push({ roll, fromMm: from, lengthMm: s.lengthMm, xMm: W - s.restMm, widthMm: s.restMm });
    for (const c of s.cutouts ?? []) {
      r.trimmed += c.widthMm * c.lengthMm;
      if (c.widthMm >= i.minRestMm && c.lengthMm >= i.minRestMm)
        rests.push({
          roll,
          fromMm: from + c.fromMm,
          lengthMm: c.lengthMm,
          xMm: c.xMm,
          widthMm: c.widthMm,
          cutout: true,
        });
    }
  });
  rolls.forEach((r, roll) => {
    if (usable - r.end >= i.minRestMm)
      rests.push({ roll, fromMm: r.end, lengthMm: usable - r.end, xMm: 0, widthMm: W });
  });

  const split = (rest: Rest, from: number, part: { widthMm: number; lengthMm: number }) => {
    const out: Rest[] = [];
    const along = rest.fromMm + rest.lengthMm - (from + part.lengthMm);
    if (along >= i.minRestMm) out.push({ ...rest, fromMm: from + part.lengthMm, lengthMm: along });
    const beside = rest.widthMm - part.widthMm;
    if (beside >= i.minRestMm)
      out.push({ ...rest, fromMm: from, lengthMm: part.lengthMm, xMm: rest.xMm + part.widthMm, widthMm: beside });
    return out;
  };

  for (const index of order) {
    const p = i.parts[index];
    if (!p) continue;
    // With a pattern a part keeps its place across the roll: only rests from the left edge.
    const fit = rests
      .map((rest, k) => {
        const r = rolls[rest.roll] as RollState;
        const from = at(rest.fromMm, r.base, p.phaseMm);
        const ok =
          rest.widthMm >= p.widthMm - EPS &&
          from + p.lengthMm <= rest.fromMm + rest.lengthMm + EPS &&
          (repeat <= 0 || rest.xMm <= EPS);
        return ok ? { k, from, spare: rest.widthMm * rest.lengthMm - p.widthMm * p.lengthMm } : undefined;
      })
      .filter((f): f is { k: number; from: number; spare: number } => f !== undefined);
    const chosen = best ? fit.sort((a, b) => a.spare - b.spare)[0] : fit[0];
    if (chosen) {
      const rest = rests[chosen.k] as Rest;
      (rolls[rest.roll] as RollState).cuts.push({
        kind: "part",
        index,
        fromMm: chosen.from,
        lengthMm: p.lengthMm,
        xMm: rest.xMm,
        widthMm: p.widthMm,
        fromRest: true,
        ...(rest.cutout ? { fromCutout: true } : {}),
      });
      rests.splice(chosen.k, 1, ...split(rest, chosen.from, p));
    } else {
      rolls.push({ base: wrap(p.phaseMm), end: p.lengthMm, cuts: [], trimmed: 0 });
      const roll = rolls.length - 1;
      (rolls[roll] as RollState).cuts.push({
        kind: "part",
        index,
        fromMm: 0,
        lengthMm: p.lengthMm,
        xMm: 0,
        widthMm: p.widthMm,
        fromRest: false,
      });
      rests.push(...split({ roll, fromMm: 0, lengthMm: usable, xMm: 0, widthMm: W }, 0, p));
    }
  }

  // A fresh roll: how many strips of the first length it gives — phases alternating (0, half, 0 …) or one phase
  // (each phase from its own roll), the most strips, then the most slack.
  const first = i.strips[0];
  let perRoll = 0;
  let end = 0;
  if (first) {
    const half = i.strips[1] ? wrap((i.strips[1]?.phaseMm ?? 0) - first.phaseMm) : 0;
    for (const shift of half > 0 ? [half, 0] : [0]) {
      let n = 0;
      let e = 0;
      for (;;) {
        const from = n === 0 ? 0 : at(e, 0, n % 2 === 1 ? shift : 0);
        if (from + first.lengthMm > usable + EPS) break;
        e = from + first.lengthMm;
        n++;
      }
      if (n > perRoll || (n === perRoll && e < end)) {
        perRoll = n;
        end = e;
      }
    }
  }

  const m2 = (w: number, l: number) => (w * l) / 1e6;
  const out = rolls.map((r, roll): PlannedRoll => {
    const left = rests.filter((rest) => rest.roll === roll).map(({ roll: _, cutout: __, ...rest }) => rest);
    // A part cut from a strip's trimmed-off area is counted by the part, not twice.
    const usedM2 = r.cuts.reduce((n, c) => n + m2(c.widthMm, c.lengthMm), 0) - r.trimmed / 1e6;
    const restM2 = left.reduce((n, rest) => n + m2(rest.widthMm, rest.lengthMm), 0);
    return { cuts: r.cuts, rests: left, usedM2, restM2, wasteM2: Math.max(m2(W, i.rollLengthMm) - usedM2 - restM2, 0) };
  });
  const tailMm = Math.max(
    0,
    ...out.flatMap((r) =>
      r.rests.filter((rest) => rest.xMm <= EPS && rest.widthMm >= W - EPS).map((rest) => rest.lengthMm),
    ),
  );
  return { fits: true, rolls: out, perRoll, perRollSlackMm: first ? usable - end : 0, tailMm };
}

export function planCuts(i: CutPlanInput): CutPlan {
  const usable = i.rollLengthMm - (i.repeatMm > 0 && !i.luckyStart ? i.repeatMm - 1 : 0);
  const empty: CutPlan = { fits: false, rolls: [], perRoll: 0, perRollSlackMm: 0, tailMm: 0 };
  if (i.strips.some((s) => s.lengthMm > usable + EPS)) return { ...empty, tooLong: "strip" };
  if (i.parts.some((p) => p.lengthMm > usable + EPS || p.widthMm > i.rollWidthMm + EPS))
    return { ...empty, tooLong: "part" };
  const idx = i.parts.map((_, k) => k);
  const by = (f: (p: CutPlanInput["parts"][number]) => number) =>
    [...idx].sort((a, b) => f(i.parts[b] as never) - f(i.parts[a] as never) || a - b);
  const orders = [by((p) => p.lengthMm), by((p) => p.widthMm * p.lengthMm), by((p) => p.widthMm * 1e6 + p.lengthMm)];
  // Strips of several pattern phases (offset match): also each phase from its own roll.
  const wrap = (v: number) => (i.repeatMm > 0 ? ((v % i.repeatMm) + i.repeatMm) % i.repeatMm : 0);
  const phases = new Set(i.strips.map((s) => wrap(s.phaseMm))).size;
  let bestPlan: CutPlan | undefined;
  for (const grouped of phases > 1 ? [false, true] : [false])
    for (const order of i.quick ? orders.slice(0, 1) : orders)
      for (const rule of i.quick ? [true] : [true, false]) {
        const candidate = plan(i, order, rule, grouped);
        if (
          !bestPlan ||
          candidate.rolls.length < bestPlan.rolls.length ||
          (candidate.rolls.length === bestPlan.rolls.length && candidate.tailMm > bestPlan.tailMm + EPS)
        )
          bestPlan = candidate;
      }
  return bestPlan as CutPlan;
}
