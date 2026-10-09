/**
 * Norm data (consumption rates, overlaps, lux tables) with where each number comes from.
 * Tools read them by id; content text substitutes them as `{{norm.<id>}}`. Never add a value without a source.
 */
export interface Norm {
  value: number;
  /** Display unit, Russian («мм», «кг/м²», «%»). */
  unit: string;
  /** Datasheet, standard (СП, ГОСТ) or manufacturer page the value is taken from. */
  source: string;
  /** Date the source was last checked, YYYY-MM-DD. */
  checkedAt: string;
  note?: string;
}

/** Keyed by dotted id: `underlay.overlap`. Filled per tool together with its golden examples (P0.7, Phase 5–6). */
export const norms: Readonly<Record<string, Norm>> = {};

export const getNorm = (id: string, from: Readonly<Record<string, Norm>> = norms): Norm | undefined => from[id];
