import fc from "fast-check";
import { expect } from "vitest";
import { growthViolations, resultViolations } from "../src/invariants";
import type { CalcContext, ToolModule } from "../src/types";
import type { ToolArbitrary } from "./arbitraries";

const ctx: CalcContext = { country: "RU" };

/** The four properties from tech spec §5 for one tool. Shared by invariants.test.ts and the harness self-test. */
export function checkTool<I>(tool: ToolModule<I>, arb: ToolArbitrary<I>, runs = 300) {
  const full = arb.input(fc).map((partial) => tool.input.parse({ ...tool.defaults(ctx), ...partial }));
  fc.assert(
    fc.property(full, (input) => {
      expect(resultViolations(tool.compute(input, ctx))).toEqual([]);
    }),
    { numRuns: runs },
  );
  fc.assert(
    fc.property(full, (input) => {
      expect(growthViolations(tool.compute(input, ctx), tool.compute(arb.grow(input), ctx))).toEqual([]);
    }),
    { numRuns: runs },
  );
}
