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
