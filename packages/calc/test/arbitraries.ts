import type fc from "fast-check";
import type { ToolId } from "../src/tools";
import type { OboiInput } from "../src/tools/oboi";
import type { PloshchadKomnatyInput } from "../src/tools/ploshchad-komnaty";
import type { PloshchadStenInput } from "../src/tools/ploshchad-sten";

/**
 * fast-check input generators for every tool with a formula (version ≥ 1), used by invariants.test.ts.
 * `grow` returns the same input with a larger area — the monotonic-in-area property compares the two.
 * Generators stay inside the tool's schema bounds; a tool without an entry fails the invariants test.
 */
export interface ToolArbitrary<I> {
  input(f: typeof fc): fc.Arbitrary<Partial<I>>;
  grow(input: I): I;
}

const lengthMm = (f: typeof fc) => f.integer({ min: 300, max: 50_000 });
const grow = <I extends { lengthMm: number }>(input: I): I => ({ ...input, lengthMm: input.lengthMm + 1000 });

const ploshchadKomnaty: ToolArbitrary<PloshchadKomnatyInput> = {
  input: (f) =>
    f.record({
      shape: f.constantFrom("rect", "l"),
      lengthMm: lengthMm(f),
      widthMm: lengthMm(f),
      cutLengthMm: f.integer({ min: 0, max: 60_000 }),
      cutWidthMm: f.integer({ min: 0, max: 60_000 }),
      nicheLengthMm: f.integer({ min: 0, max: 20_000 }),
      nicheDepthMm: f.integer({ min: 0, max: 20_000 }),
      protrusionLengthMm: f.integer({ min: 0, max: 20_000 }),
      protrusionDepthMm: f.integer({ min: 0, max: 20_000 }),
    }),
  grow,
};

const ploshchadSten: ToolArbitrary<PloshchadStenInput> = {
  input: (f) =>
    f.record({
      lengthMm: lengthMm(f),
      widthMm: lengthMm(f),
      heightMm: f.integer({ min: 1000, max: 10_000 }),
      openings: f.array(
        f.record({
          type: f.constantFrom("door" as const, "window" as const),
          widthMm: f.integer({ min: 100, max: 10_000 }),
          heightMm: f.integer({ min: 100, max: 10_000 }),
          count: f.integer({ min: 0, max: 50 }),
        }),
        { maxLength: 20 },
      ),
    }),
  grow,
};

const oboi: ToolArbitrary<OboiInput> = {
  input: (f) =>
    f.record({
      lengthMm: lengthMm(f),
      widthMm: lengthMm(f),
      heightMm: f.integer({ min: 1000, max: 10_000 }),
      openings: f.array(
        f.record({
          type: f.constantFrom("door" as const, "window" as const),
          widthMm: f.integer({ min: 100, max: 10_000 }),
          heightMm: f.integer({ min: 100, max: 10_000 }),
          count: f.integer({ min: 0, max: 50 }),
        }),
        { maxLength: 20 },
      ),
      rollWidthMm: f.integer({ min: 300, max: 1500 }),
      rollLengthMm: f.integer({ min: 5000, max: 50_000 }),
      repeatMm: f.integer({ min: 0, max: 1500 }),
      match: f.constantFrom("straight" as const, "offset" as const),
      trimMm: f.integer({ min: 0, max: 300 }),
      pasteCoverageM2: f.double({ min: 1, max: 200, noNaN: true }),
    }),
  grow,
};

export const arbitraries: Partial<Record<ToolId, ToolArbitrary<never>>> = {
  "ploshchad-komnaty": ploshchadKomnaty as ToolArbitrary<never>,
  "ploshchad-sten": ploshchadSten as ToolArbitrary<never>,
  oboi: oboi as ToolArbitrary<never>,
};
