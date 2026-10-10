/**
 * Pure calculation engine. Allowed imports: `zod` and relative modules only.
 * No React, `fetch`, `Date.now()` or `Math.random()` — see docs/code/calc-engine.md.
 */
export const CALC_PACKAGE = "@umnyaut/calc";

export * from "./blocks";
export type {
  BenchmarkObservation,
  ExpectedItem,
  GoldenExample,
  GoldenExpectation,
  GoldenFile,
  GoldenSource,
} from "./golden";
export * from "./project";
export { type ToolId, toolModules } from "./tools";
export { NOTCH_TABLE } from "./tools/klej";
export { LAMINATE_WASTE_PCT } from "./tools/laminat";
export { TILE_DIAGONAL_RESERVE_PCT } from "./tools/plitka";
export { costOf, type PriceBasis, priced, priceField } from "./tools/priced";
export { GROUT_DENSITY } from "./tools/zatirka";
export type {
  CalcContext,
  Cost,
  Country,
  Layout,
  LayoutPiece,
  Opening,
  Pack,
  PurchaseItem,
  Quantity,
  Room,
  Step,
  ToolModule,
  ToolResult,
  Unit,
  Warning,
} from "./types";
