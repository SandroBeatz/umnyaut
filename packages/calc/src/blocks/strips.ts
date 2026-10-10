/**
 * Strips cut from rolls (wallpaper now; linoleum and curtains later). Full-height strips are cut one after
 * another; with a pattern each one must start where the pattern lines up with its neighbour: every `repeat`
 * for a straight match, alternating 0 and repeat / 2 for an offset (drop) match. Short pieces (above doors,
 * above and below windows) go into the tails of the rolls first, a new roll only when no tail fits.
 * Where the pattern starts on a new roll is unknown, so with a repeat each roll is taken at the worst case:
 * up to one repeat (repeat − 1 mm) is lost before its first cut. That matches the fitters' rule
 * «высота + раппорт» per strip. Tails shorter than a piece are waste.
 */
export interface StripCutInput {
  rollLengthMm: number;
  /** Pattern repeat (раппорт); 0 = no pattern to match. */
  repeatMm: number;
  /** Offset (drop) match: neighbouring strips are shifted by half a repeat. */
  offset: boolean;
  stripLengthMm: number;
  strips: number;
  /** Short pieces in mm, any order; each may start at any allowed phase. */
  pieces?: readonly number[];
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
  const pieces = (input.pieces ?? []).filter((p) => p > 0).map((p) => p * SCALE);
  const phaseOf = (k: number) => (k % 2 === 1 ? half : 0);
  const anyPhase = half > 0 ? [0, half] : [0];

  if (strip > roll || !(roll > 0)) {
    return { fits: false, tooLong: "strip", rolls: 0, perRoll: 0, perRollSlackMm: 0, remnantsMm: [] };
  }
  if (pieces.some((p) => p > roll)) {
    return { fits: false, tooLong: "piece", rolls: 0, perRoll: 0, perRollSlackMm: 0, remnantsMm: [] };
  }

  /**
   * Each roll keeps its own pattern frame: the worst-case lead already reaches any phase, so the first cut of a
   * roll is at 0 and `base` is the wall phase it lines up with. A later cut at wall phase `phase` must start
   * where (position + base) ≡ phase (mod repeat).
   */
  interface Roll {
    end: number;
    base: number;
  }
  const local = (r: Roll, phase: number) => (repeat > 0 ? (((phase - r.base) % repeat) + repeat) % repeat : 0);
  const next = (r: Roll, phase: number) => startAt(r.end, local(r, phase), repeat);

  let perRoll = 0;
  const fresh: Roll = { end: 0, base: 0 };
  for (; strip > 0; perRoll++) {
    const start = perRoll === 0 ? 0 : next(fresh, phaseOf(perRoll));
    if (start + strip > roll) break;
    fresh.end = start + strip;
  }

  const rolls: Roll[] = [];
  for (let k = 0; k < strips; k++) {
    const last = rolls[rolls.length - 1];
    const start = last ? next(last, phaseOf(k)) : roll;
    if (last && start + strip <= roll) last.end = start + strip;
    else rolls.push({ end: strip, base: phaseOf(k) });
  }

  for (const piece of [...pieces].sort((a, b) => b - a)) {
    const earliest = (r: Roll) => Math.min(...anyPhase.map((phase) => next(r, phase)));
    const target = rolls.find((r) => earliest(r) + piece <= roll);
    if (target) target.end = earliest(target) + piece;
    else rolls.push({ end: piece, base: 0 });
  }

  return {
    fits: true,
    rolls: rolls.length,
    perRoll,
    perRollSlackMm: (roll - fresh.end) / SCALE,
    remnantsMm: rolls.map((r) => (roll - r.end) / SCALE),
  };
}
