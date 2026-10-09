import type fc from "fast-check";
import type { ToolId } from "../src/tools";

/**
 * fast-check input generators for every tool with a formula (version ≥ 1), used by invariants.test.ts.
 * `grow` returns the same input with a larger area — the monotonic-in-area property compares the two.
 * Generators stay inside the tool's schema bounds; a tool without an entry fails the invariants test.
 */
export interface ToolArbitrary<I> {
  input(f: typeof fc): fc.Arbitrary<Partial<I>>;
  grow(input: I): I;
}

export const arbitraries: Partial<Record<ToolId, ToolArbitrary<never>>> = {};
