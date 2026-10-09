import type { z } from "zod";

/** Contract from docs/code/calc-engine.md. Skeleton for registry-driven routes; P4.1 fills in the result types. */
export type Country = "RU" | "KZ" | "BY" | "KG";

export interface CalcContext {
  country: Country;
}

export interface ToolResult {
  items: readonly unknown[];
  summary: readonly unknown[];
  warnings: readonly unknown[];
  steps: readonly unknown[];
}

export interface ToolModule<I = unknown, R extends ToolResult = ToolResult> {
  id: string;
  /** Bump when the formula changes. 0 = placeholder without a formula. */
  version: number;
  input: z.ZodType<I>;
  defaults(ctx: CalcContext): I;
  compute(input: I, ctx: CalcContext): R;
}
