import { describe, expect, it } from "vitest";
import { toolModules } from "../src/tools";
import type { ToolModule } from "../src/types";
import { arbitraries, type ToolArbitrary } from "./arbitraries";
import { checkTool } from "./check-tool";

describe("invariants", () => {
  for (const [id, tool] of Object.entries(toolModules) as [string, ToolModule<unknown>][]) {
    if (tool.version === 0) {
      it.skip(`${id}: placeholder (version 0)`);
      continue;
    }
    it(`${id}: bought ≥ need, whole packs, finite, monotonic in area`, () => {
      const arb = arbitraries[id as keyof typeof arbitraries] as ToolArbitrary<unknown> | undefined;
      expect(arb, `add ${id} to test/arbitraries.ts`).toBeDefined();
      checkTool(tool, arb as ToolArbitrary<unknown>);
    });
  }
});
