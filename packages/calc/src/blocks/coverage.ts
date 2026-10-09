/**
 * Consumption by area: area × rate per m² per layer × layers × base coefficient (× waste).
 * Used by paint, primer, putty, plaster, tile adhesive and grout; the rate comes from a datasheet in `catalog`.
 */
export interface CoverageInput {
  areaM2: number;
  /** Consumption per m² for one layer, in the product's unit (kg, l). */
  ratePerM2: number;
  layers?: number;
  /** Surface/base correction, e.g. 1.15 for porous plaster; 1 = as on the datasheet. */
  baseCoef?: number;
  /** Extra %, e.g. losses on the trowel. */
  wastePct?: number;
}

export function coverage({ areaM2, ratePerM2, layers = 1, baseCoef = 1, wastePct = 0 }: CoverageInput): number {
  if (!(areaM2 > 0) || !(ratePerM2 > 0) || !(layers > 0) || !(baseCoef > 0)) return 0;
  return areaM2 * ratePerM2 * layers * baseCoef * (1 + Math.max(wastePct, 0) / 100);
}
