// Shape of packages/calc/src/tools/<id>/golden.ts.
// At least 10 entries per tool; the shared golden test fails the build otherwise.
// Every entry needs a `source`: datasheet, norm table, manual calc, or competitor cross-check.

import type { GoldenExample } from '../../golden';
import type { LaminatInput } from './index';

export const golden: GoldenExample<LaminatInput>[] = [
  {
    name: 'business spec example: 4.6 × 4.3 m, straight laying, pack 2.22 m²',
    ctx: { country: 'RU' },
    input: {
      lengthMm: 4600,
      widthMm: 4300,
      packAreaM2: 2.22,
      method: 'straight',
      wastePct: 10,
    },
    expect: {
      // Only assert what matters; partial match against ToolResult.
      items: [{ key: 'laminate', packs: 10 }],
      warnings: [{ code: 'narrow_last_row' }],
    },
    source: 'Manual calc: 19.78 m² × 1.10 = 21.76 m² ÷ 2.22 = 9.8 → 10 packs (business spec §7, mockup)',
  },
  {
    name: 'pack boundary: need is an exact multiple of pack area',
    ctx: { country: 'RU' },
    input: { lengthMm: 4000, widthMm: 5000, packAreaM2: 2.2, method: 'straight', wastePct: 10 },
    expect: { items: [{ key: 'laminate', packs: 10 }] },
    source: 'Manual calc: 20 × 1.10 = 22.0 ÷ 2.2 = 10.000… → 10 (ceilPacks tolerance)',
  },
  // …at least 8 more: small room, large room, openings, diagonal, herringbone,
  // +ε above a pack boundary, related items (underlay, plinth), warning cases.
];
