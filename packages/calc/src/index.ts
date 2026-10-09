/**
 * Pure calculation engine. Allowed imports: `zod` and relative modules only.
 * No React, `fetch`, `Date.now()` or `Math.random()` — see docs/code/calc-engine.md.
 */
export const CALC_PACKAGE = "@umnyaut/calc";

export { type ToolId, toolModules } from "./tools";
export type { CalcContext, Country, ToolModule, ToolResult } from "./types";
