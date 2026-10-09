/**
 * Strips cut from rolls (wallpaper now; linoleum and curtains later). Full-height strips are cut one after
 * another; with a pattern each one must start where the pattern lines up with its neighbour: every `repeat`
 * for a straight match, alternating 0 and repeat / 2 for an offset (drop) match. Short pieces (above doors,
 * above and below windows) go into the tails of the rolls first, a new roll only when no tail fits.
 * The roll is assumed to start at pattern phase 0; tails shorter than a piece are waste.
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
}

export interface StripCut {
  /** False when a strip or a piece is longer than the roll; nothing is cut then. */
  fits: boolean;
  rolls: number;
  /** Full strips a fresh roll gives. */
  perRoll: number;
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
  const roll = input.rollLengthMm * SCALE;
  const repeat = Math.max(input.repeatMm, 0) * SCALE;
  const half = input.offset && repeat > 0 ? repeat / 2 : 0;
  const strip = input.stripLengthMm * SCALE;
  const strips = Math.max(Math.trunc(input.strips), 0);
  const pieces = (input.pieces ?? []).filter((p) => p > 0).map((p) => p * SCALE);
  const phaseOf = (k: number) => (k % 2 === 1 ? half : 0);
  const anyPhase = half > 0 ? [0, half] : [0];

  if ((strips > 0 && strip > roll) || pieces.some((p) => p > roll) || !(roll > 0)) {
    return { fits: false, rolls: 0, perRoll: 0, remnantsMm: [] };
  }

  let perRoll = 0;
  for (let pos = 0; strip > 0; perRoll++) {
    const start = startAt(pos, phaseOf(perRoll), repeat);
    if (start + strip > roll) break;
    pos = start + strip;
  }

  const ends: number[] = [];
  for (let k = 0; k < strips; k++) {
    const last = ends.length - 1;
    const start = last < 0 ? roll : startAt(ends[last] as number, phaseOf(k), repeat);
    if (start + strip <= roll) ends[last] = start + strip;
    else ends.push(startAt(0, phaseOf(k), repeat) + strip);
  }

  for (const piece of [...pieces].sort((a, b) => b - a)) {
    const earliest = (pos: number) => Math.min(...anyPhase.map((phase) => startAt(pos, phase, repeat)));
    const i = ends.findIndex((end) => earliest(end) + piece <= roll);
    if (i >= 0) ends[i] = earliest(ends[i] as number) + piece;
    else ends.push(piece);
  }

  return { fits: true, rolls: ends.length, perRoll, remnantsMm: ends.map((end) => (roll - end) / SCALE) };
}
