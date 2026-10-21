import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { plitka, TILE_DIAGONAL_RESERVE_PCT } from "../src/tools/plitka";
import type { CalcContext } from "../src/types";
import { arbitraries } from "./arbitraries";

const ctx: CalcContext = { country: "RU" };
const arb = arbitraries.plitka;
if (!arb) throw new Error("plitka arbitrary is missing");
const inputs = arb.input(fc).map((partial) => plitka.input.parse({ ...plitka.defaults(ctx), ...(partial as object) }));
const tiles = (r: ReturnType<typeof plitka.compute>) => r.items.find((it) => it.key === "tile");

/** Formula review 2026-10-21: diagonal laying of a room never buys less tile than straight laying of the same room. */
describe("plitka diagonal vs straight", () => {
  it("diagonal tiles and boxes ≥ straight for the same room, tile, joint, start and reserve", () => {
    fc.assert(
      fc.property(inputs, (input) => {
        const straight = tiles(plitka.compute({ ...input, layout: "straight" }, ctx));
        const diagonal = tiles(plitka.compute({ ...input, layout: "diagonal" }, ctx));
        if (!straight) return;
        expect(diagonal).toBeDefined();
        expect(diagonal?.need.value).toBeGreaterThanOrEqual(straight.need.value);
        expect(diagonal?.packs).toBeGreaterThanOrEqual(straight.packs);
      }),
      { numRuns: 300 },
    );
    // Two full computes per run (wall schemes tile by tile): seconds on a slow CI runner, as in invariants.test.ts.
  }, 30_000);

  it("diagonal reserve is the user's, never under the diagonal norm", () => {
    fc.assert(
      fc.property(inputs, (input) => {
        const r = plitka.compute({ ...input, layout: "diagonal" }, ctx);
        const step = r.steps.find((s) => s.code === "reserve" || s.code === "reserve_diagonal");
        if (!step) return;
        expect(step.values.pct).toBe(Math.max(input.reservePct, TILE_DIAGONAL_RESERVE_PCT));
      }),
      { numRuns: 200 },
    );
  }, 30_000);
});
