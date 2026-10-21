/**
 * Strips cut from rolls (wallpaper now; linoleum and curtains later). Full-height strips are cut one after
 * another; with a pattern each one must start where the pattern lines up with its neighbour: every `repeat`
 * for a straight match, alternating 0 and repeat / 2 for an offset (drop) match. An offset match is also tried
 * the fitters' way — strips of each phase from their own roll (two rolls alternately), so no half repeat is lost
 * between strips — and the plan with fewer rolls wins. Short pieces (above doors, above and below windows) go
 * into the tails of the rolls first, a new roll only when no tail fits.
 * Where the pattern starts on a new roll is unknown, so with a repeat each roll is taken at the worst case:
 * up to one repeat (repeat − 1 mm) is lost once per roll before its first cut — less than the fitters' cautious
 * rule «высота + раппорт», which loses a repeat on every strip. Tails shorter than a piece are waste.
 */
export interface StripCutInput {
  rollLengthMm: number;
  /** Pattern repeat (раппорт); 0 = no pattern to match. */
  repeatMm: number;
  /** Offset (drop) match: neighbouring strips are shifted by half a repeat. */
  offset: boolean;
  stripLengthMm: number;
  strips: number;
  /** Short pieces in mm, any order; each may start at any allowed phase unless `piecePhasesMm` fixes it. */
  pieces?: readonly number[];
  /**
   * Where the pattern must be at the start of each strip and piece, mm into the repeat — known once the strips
   * are placed on the walls (a piece below a window starts lower than its strip). Without them strips alternate
   * 0 and repeat / 2 and a piece takes whichever allowed phase fits first.
   */
  stripPhasesMm?: readonly number[];
  piecePhasesMm?: readonly number[];
  /** Best case: every roll starts right at the pattern (no lead). For the «удачное начало» hint only. */
  luckyStart?: boolean;
}

export interface StripCut {
  /** False when a strip or a piece is longer than the usable roll; nothing is cut then. */
  fits: boolean;
  /** What did not fit, when `fits` is false. */
  tooLong?: "strip" | "piece";
  rolls: number;
  /** Full strips a fresh roll gives. */
  perRoll: number;
  /** What a fresh roll leaves after those strips, mm (for the tight-roll warning). */
  perRollSlackMm: number;
  /** Unused tail of each roll, mm. */
  remnantsMm: number[];
  /** What each roll is cut into, in cutting order: strip `index` (0-based) or piece `index` of `pieces`. */
  cuts: { kind: "strip" | "piece"; index: number; startMm: number }[][];
  /**
   * Set when strips of each phase were cut from their own rolls (that plan won): strips and rolls per phase in
   * phase order, and how many strips of one phase a fresh roll gives — for a step a person can recount.
   */
  phases?: { strips: number[]; rolls: number[]; perRoll: number };
}

/** Coordinates are doubled inside so that half a repeat stays an integer. */
const SCALE = 2;

/** First position ≥ `pos` where the pattern is at `phase`. */
function startAt(pos: number, phase: number, repeat: number): number {
  if (repeat <= 0) return pos;
  return phase + Math.max(Math.ceil((pos - phase) / repeat), 0) * repeat;
}

export function cutStrips(input: StripCutInput): StripCut {
  const repeat = Math.max(input.repeatMm, 0) * SCALE;
  // Usable length after the worst-case lead to the pattern; positions below count from its end.
  const roll = input.rollLengthMm * SCALE - (repeat > 0 && !input.luckyStart ? repeat - SCALE : 0);
  const half = input.offset && repeat > 0 ? repeat / 2 : 0;
  const strip = input.stripLengthMm * SCALE;
  const strips = Math.max(Math.trunc(input.strips), 0);
  // Indices stay those of `input.pieces`; empty pieces are skipped when cutting.
  const pieces = (input.pieces ?? []).map((p) => Math.max(p, 0) * SCALE);
  const alternate = (k: number) => (k % 2 === 1 ? half : 0);
  const wrapPhase = (mm: number) => (repeat > 0 ? (((mm * SCALE) % repeat) + repeat) % repeat : 0);
  const phaseOf = (k: number) =>
    input.stripPhasesMm?.[k] === undefined ? alternate(k) : wrapPhase(input.stripPhasesMm[k] ?? 0);
  const anyPhase = half > 0 ? [0, half] : [0];

  if (strip > roll || !(roll > 0)) {
    return { fits: false, tooLong: "strip", rolls: 0, perRoll: 0, perRollSlackMm: 0, remnantsMm: [], cuts: [] };
  }
  if (pieces.some((p) => p > roll)) {
    return { fits: false, tooLong: "piece", rolls: 0, perRoll: 0, perRollSlackMm: 0, remnantsMm: [], cuts: [] };
  }

  /**
   * Each roll keeps its own pattern frame: the worst-case lead already reaches any phase, so the first cut of a
   * roll is at 0 and `base` is the wall phase it lines up with. A later cut at wall phase `phase` must start
   * where (position + base) ≡ phase (mod repeat).
   */
  interface Roll {
    end: number;
    base: number;
    cuts: StripCut["cuts"][number];
  }
  const local = (r: Roll, phase: number) => (repeat > 0 ? (((phase - r.base) % repeat) + repeat) % repeat : 0);
  const next = (r: Roll, phase: number) => startAt(r.end, local(r, phase), repeat);

  // A fresh roll: phases alternating, or one phase (each phase from its own roll) — the most strips, then the
  // most slack.
  const freshRoll = (phase: (k: number) => number) => {
    let n = 0;
    const r: Roll = { end: 0, base: 0, cuts: [] };
    for (; strip > 0; n++) {
      const start = n === 0 ? 0 : next(r, phase(n));
      if (start + strip > roll) break;
      r.end = start + strip;
    }
    return { n, end: r.end };
  };
  const onePhase = freshRoll(() => 0);
  const [fresh] = [freshRoll(alternate), onePhase].sort((a, b) => b.n - a.n || a.end - b.end) as [
    { n: number; end: number },
  ];
  const perRoll = fresh.n;

  const cut = (grouped: boolean): Roll[] => {
    const rolls: Roll[] = [];
    /** The roll strips of each phase are cut from now (grouped), else the last one. */
    const open = new Map<number, Roll>();
    for (let k = 0; k < strips; k++) {
      const phase = phaseOf(k);
      const last = grouped ? open.get(phase) : rolls[rolls.length - 1];
      const start = last ? next(last, phase) : roll;
      if (last && start + strip <= roll) {
        last.cuts.push({ kind: "strip", index: k, startMm: start / SCALE });
        last.end = start + strip;
      } else {
        const fresh: Roll = { end: strip, base: phase, cuts: [{ kind: "strip", index: k, startMm: 0 }] };
        rolls.push(fresh);
        open.set(phase, fresh);
      }
    }

    // Longest pieces first; equal ones in their order.
    const order = pieces
      .map((p, index) => ({ p, index }))
      .filter(({ p }) => p > 0)
      .sort((a, b) => b.p - a.p || a.index - b.index);
    for (const { p: piece, index } of order) {
      const fixed = input.piecePhasesMm?.[index];
      const phases = fixed === undefined ? anyPhase : [wrapPhase(fixed)];
      const earliest = (r: Roll) => Math.min(...phases.map((phase) => next(r, phase)));
      const target = rolls.find((r) => earliest(r) + piece <= roll);
      if (target) {
        const start = earliest(target);
        target.cuts.push({ kind: "piece", index, startMm: start / SCALE });
        target.end = start + piece;
      } else rolls.push({ end: piece, base: phases[0] ?? 0, cuts: [{ kind: "piece", index, startMm: 0 }] });
    }
    return rolls;
  };
  const inOrder = cut(false);
  const phases = new Set(Array.from({ length: strips }, (_, k) => phaseOf(k))).size;
  const byPhase = phases > 1 ? cut(true) : inOrder;
  const rolls = byPhase.length < inOrder.length ? byPhase : inOrder;
  const phaseList = [...new Set(Array.from({ length: strips }, (_, k) => phaseOf(k)))].sort((a, b) => a - b);
  const phaseOfRoll = (r: Roll) => {
    const first = r.cuts.find((c) => c.kind === "strip");
    return first === undefined ? undefined : phaseOf(first.index);
  };

  return {
    fits: true,
    rolls: rolls.length,
    perRoll,
    perRollSlackMm: (roll - fresh.end) / SCALE,
    remnantsMm: rolls.map((r) => (roll - r.end) / SCALE),
    cuts: rolls.map((r) => r.cuts),
    ...(rolls === byPhase && byPhase !== inOrder
      ? {
          phases: {
            strips: phaseList.map(
              (ph) => Array.from({ length: strips }, (_, k) => phaseOf(k)).filter((x) => x === ph).length,
            ),
            rolls: phaseList.map((ph) => byPhase.filter((r) => phaseOfRoll(r) === ph).length),
            perRoll: onePhase.n,
          },
        }
      : {}),
  };
}
