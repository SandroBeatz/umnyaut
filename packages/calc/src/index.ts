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
export { LAMINATE_WASTE_PCT, UNDERLAY_ROLL_WIDTH_MM } from "./tools/laminat";
export {
  LINOLEUM_DOORWAY_MM,
  LINOLEUM_TRIM_ALLOWANCE_MM,
  LINOLEUM_WALL_TRIM_MM,
  LINOLEUM_WIDTHS_MM,
} from "./tools/linoleum";
export { upgradeInput } from "./tools/pattern";
export { TILE_DIAGONAL_RESERVE_PCT } from "./tools/plitka";
export { costOf, type PriceBasis, priced, priceField } from "./tools/priced";
export { GROUT_DENSITY } from "./tools/zatirka";
export type {
  BareZone,
  CalcContext,
  Cost,
  Country,
  CutCorner,
  ElevationOpening,
  Layout,
  LayoutElevation,
  LayoutMark,
  LayoutPiece,
  LayoutRoll,
  LayoutRollCut,
  LayoutRow,
  LayoutRun,
  LayoutSheet,
  LayoutWallStrips,
  Opening,
  OpeningPlace,
  Pack,
  PlanWall,
  PurchaseItem,
  Quantity,
  Room,
  Step,
  ToolModule,
  ToolResult,
  Unit,
  Warning,
} from "./types";
