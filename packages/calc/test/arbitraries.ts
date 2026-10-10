import type fc from "fast-check";
import type { ToolId } from "../src/tools";
import type { KlejInput } from "../src/tools/klej";
import type { KraskaInput } from "../src/tools/kraska";
import type { LaminatInput } from "../src/tools/laminat";
import type { LinoleumInput } from "../src/tools/linoleum";
import type { OboiInput } from "../src/tools/oboi";
import type { PlintusInput } from "../src/tools/plintus";
import type { PlitkaInput } from "../src/tools/plitka";
import type { PloshchadKomnatyInput } from "../src/tools/ploshchad-komnaty";
import type { PloshchadStenInput } from "../src/tools/ploshchad-sten";
import type { ZatirkaInput } from "../src/tools/zatirka";

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

/** Growing the room must not turn an oversized cut-out into a real one (area would drop); golden covers it. */
const validCut = <
  T extends { shape: "rect" | "l"; lengthMm: number; widthMm: number; cutLengthMm: number; cutWidthMm: number },
>(
  v: T,
): T => (v.shape === "l" && (v.cutLengthMm >= v.lengthMm || v.cutWidthMm >= v.widthMm) ? { ...v, shape: "rect" } : v);

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
      primer: f.boolean(),
      primerRateLPerM2: f.double({ min: 0.05, max: 1, noNaN: true }),
      primerPackL: f.double({ min: 0.5, max: 50, noNaN: true }),
    }),
  grow,
};

const opening = (f: typeof fc) =>
  f.record({
    type: f.constantFrom("door" as const, "window" as const),
    widthMm: f.integer({ min: 100, max: 10_000 }),
    heightMm: f.integer({ min: 100, max: 10_000 }),
    count: f.integer({ min: 0, max: 50 }),
  });

const kraska: ToolArbitrary<KraskaInput> = {
  input: (f) =>
    f.record({
      lengthMm: lengthMm(f),
      widthMm: lengthMm(f),
      heightMm: f.integer({ min: 1000, max: 10_000 }),
      openings: f.array(opening(f), { maxLength: 20 }),
      surface: f.constantFrom("walls" as const, "ceiling" as const, "both" as const),
      coats: f.integer({ min: 1, max: 5 }),
      coverageM2PerL: f.double({ min: 1, max: 30, noNaN: true }),
      // Real can sizes; arbitrary integers would make the exact search slow without testing anything new.
      cansMl: f.subarray([450, 900, 1000, 2500, 2700, 3000, 5000, 9000, 10_000], { minLength: 1, maxLength: 6 }),
      primer: f.boolean(),
      primerRateLPerM2: f.double({ min: 0.05, max: 1, noNaN: true }),
      primerPackL: f.double({ min: 0.5, max: 50, noNaN: true }),
    }),
  grow,
};

const plintus: ToolArbitrary<PlintusInput> = {
  input: (f) =>
    f
      .record({
        shape: f.constantFrom("rect" as const, "l" as const),
        lengthMm: lengthMm(f),
        widthMm: lengthMm(f),
        cutLengthMm: f.integer({ min: 0, max: 60_000 }),
        cutWidthMm: f.integer({ min: 0, max: 60_000 }),
        openings: f.array(opening(f), { maxLength: 20 }),
        plankLengthMm: f.integer({ min: 1000, max: 6000 }),
      })
      .map(validCut),
  grow,
};

const klej: ToolArbitrary<KlejInput> = {
  input: (f) =>
    f
      .record({
        surface: f.constantFrom("floor" as const, "walls" as const),
        shape: f.constantFrom("rect" as const, "l" as const),
        lengthMm: lengthMm(f),
        widthMm: lengthMm(f),
        cutLengthMm: f.integer({ min: 0, max: 60_000 }),
        cutWidthMm: f.integer({ min: 0, max: 60_000 }),
        heightMm: f.integer({ min: 1000, max: 10_000 }),
        openings: f.array(opening(f), { maxLength: 20 }),
        tileLengthMm: f.integer({ min: 20, max: 3000 }),
        tileWidthMm: f.integer({ min: 20, max: 3000 }),
        method: f.constantFrom("notch" as const, "layer" as const),
        layerMm: f.double({ min: 1, max: 20, noNaN: true }),
        bagKg: f.double({ min: 1, max: 50, noNaN: true }),
      })
      .map(validCut),
  grow,
};

const zatirka: ToolArbitrary<ZatirkaInput> = {
  input: (f) =>
    f
      .record({
        surface: f.constantFrom("floor" as const, "walls" as const),
        shape: f.constantFrom("rect" as const, "l" as const),
        lengthMm: lengthMm(f),
        widthMm: lengthMm(f),
        cutLengthMm: f.integer({ min: 0, max: 60_000 }),
        cutWidthMm: f.integer({ min: 0, max: 60_000 }),
        heightMm: f.integer({ min: 1000, max: 10_000 }),
        openings: f.array(opening(f), { maxLength: 20 }),
        tileLengthMm: f.integer({ min: 20, max: 3000 }),
        tileWidthMm: f.integer({ min: 20, max: 3000 }),
        jointMm: f.double({ min: 0.5, max: 20, noNaN: true }),
        depthMm: f.double({ min: 1, max: 30, noNaN: true }),
        reservePct: f.double({ min: 0, max: 30, noNaN: true }),
        packKg: f.double({ min: 0.5, max: 25, noNaN: true }),
      })
      .map(validCut),
  grow,
};

const linoleum: ToolArbitrary<LinoleumInput> = {
  input: (f) =>
    f
      .record({
        shape: f.constantFrom("rect" as const, "l" as const),
        lengthMm: lengthMm(f),
        widthMm: lengthMm(f),
        cutLengthMm: f.integer({ min: 0, max: 60_000 }),
        cutWidthMm: f.integer({ min: 0, max: 60_000 }),
        rollWidthMm: f.oneof(f.constant(0), f.integer({ min: 500, max: 6000 })),
        overlapMm: f.integer({ min: 0, max: 300 }),
        allowanceMm: f.integer({ min: 0, max: 300 }),
        repeatMm: f.integer({ min: 0, max: 2000 }),
        cutStepMm: f.integer({ min: 10, max: 1000 }),
      })
      // Rectangles only for the growth property: with «fewest seams first» (Tarkett) a larger L-shaped room may
      // switch to one seam more, and its short sheets can then buy slightly less — correct for each room, not a
      // defect; L-shapes are covered by golden examples.
      .map((v) => ({ ...v, shape: "rect" as const })),
  grow,
};

const laminat: ToolArbitrary<LaminatInput> = {
  input: (f) =>
    f
      .record({
        shape: f.constantFrom("rect" as const, "l" as const),
        lengthMm: lengthMm(f),
        widthMm: lengthMm(f),
        cutLengthMm: f.integer({ min: 0, max: 60_000 }),
        cutWidthMm: f.integer({ min: 0, max: 60_000 }),
        direction: f.constantFrom("length" as const, "width" as const),
        method: f.constantFrom("straight" as const, "diagonal" as const, "herringbone" as const),
        boardLengthMm: f.integer({ min: 300, max: 3000 }),
        boardWidthMm: f.integer({ min: 50, max: 500 }),
        boardsPerPack: f.integer({ min: 1, max: 50 }),
        gapMm: f.integer({ min: 0, max: 30 }),
        minOffsetMm: f.integer({ min: 100, max: 1000 }),
        wastePct: f.double({ min: 0, max: 40, noNaN: true }),
        underlay: f.boolean(),
        underlayRollM2: f.double({ min: 1, max: 100, noNaN: true }),
      })
      .map(validCut),
  grow,
};

const plitka: ToolArbitrary<PlitkaInput> = {
  input: (f) =>
    f
      .record({
        surface: f.constantFrom("floor" as const, "walls" as const),
        shape: f.constantFrom("rect" as const, "l" as const),
        lengthMm: f.integer({ min: 300, max: 20_000 }),
        widthMm: f.integer({ min: 300, max: 20_000 }),
        cutLengthMm: f.integer({ min: 0, max: 30_000 }),
        cutWidthMm: f.integer({ min: 0, max: 30_000 }),
        heightMm: f.integer({ min: 1000, max: 10_000 }),
        openings: f.array(opening(f), { maxLength: 20 }),
        tileLengthMm: f.integer({ min: 20, max: 3000 }),
        tileWidthMm: f.integer({ min: 20, max: 3000 }),
        jointMm: f.double({ min: 0, max: 20, noNaN: true }),
        layout: f.constantFrom("straight" as const, "diagonal" as const),
        start: f.constantFrom("corner" as const, "center" as const),
        reservePct: f.double({ min: 0, max: 30, noNaN: true }),
        tilesPerBox: f.integer({ min: 1, max: 200 }),
        adhesive: f.boolean(),
        grout: f.boolean(),
        tileThicknessMm: f.double({ min: 3, max: 30, noNaN: true }),
      })
      .map(validCut),
  grow,
};

export const arbitraries: Partial<Record<ToolId, ToolArbitrary<never>>> = {
  "ploshchad-komnaty": ploshchadKomnaty as ToolArbitrary<never>,
  "ploshchad-sten": ploshchadSten as ToolArbitrary<never>,
  oboi: oboi as ToolArbitrary<never>,
  kraska: kraska as ToolArbitrary<never>,
  plintus: plintus as ToolArbitrary<never>,
  klej: klej as ToolArbitrary<never>,
  zatirka: zatirka as ToolArbitrary<never>,
  linoleum: linoleum as ToolArbitrary<never>,
  laminat: laminat as ToolArbitrary<never>,
  plitka: plitka as ToolArbitrary<never>,
};
