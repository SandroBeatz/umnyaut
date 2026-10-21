import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DIAGONAL_EPS_MM, diagonalGrid } from "../src/blocks";
import { klej } from "../src/tools/klej";
import { plitka, TILE_DIAGONAL_RESERVE_PCT } from "../src/tools/plitka";
import { zatirka } from "../src/tools/zatirka";
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

/**
 * Re-review 2026-10-21: the raw 45° grid, not the plitka result (which takes max(diagonal, straight)), must cover
 * the surface. Every point of the room shrunk by the tolerance ε and clear of the holes grown by ε lies in a laid
 * tile when there is no joint, so pieces × tile area ≥ that area. With a joint the cells (tile + joint) of the
 * laid tiles cover the room shrunk by a cell's diagonal: pieces × cell area ≥ that area.
 */
describe("diagonalGrid covers the surface", () => {
  const surface = fc
    .record({
      L: fc.integer({ min: 300, max: 8000 }),
      W: fc.integer({ min: 300, max: 8000 }),
      a: fc.integer({ min: 50, max: 1200 }),
      b: fc.integer({ min: 50, max: 1200 }),
      joint: fc.constantFrom(0, 0, 1.5, 3, 5),
      start: fc.constantFrom("corner" as const, "center" as const),
    })
    .chain((r) =>
      fc.record({
        r: fc.constant(r),
        holes: fc.array(
          fc.record({ x: fc.integer({ min: 0, max: r.L }), y: fc.integer({ min: 0, max: r.W }) }).chain(({ x, y }) =>
            fc.record({
              x: fc.constant(x),
              y: fc.constant(y),
              w: fc.integer({ min: 0, max: r.L - x }),
              h: fc.integer({ min: 0, max: r.W - y }),
            }),
          ),
          { maxLength: 3 },
        ),
      }),
    );

  it("pieces ≥ ⌈covered area / tile (cell) area⌉", () => {
    fc.assert(
      fc.property(surface, ({ r, holes }) => {
        const d = diagonalGrid({
          lengthMm: r.L,
          widthMm: r.W,
          tileLengthMm: r.a,
          tileWidthMm: r.b,
          jointMm: r.joint,
          start: r.start,
          holes,
        });
        const pu = r.a + r.joint;
        const pv = r.b + r.joint;
        const by = r.joint === 0 ? DIAGONAL_EPS_MM : Math.hypot(pu, pv) + DIAGONAL_EPS_MM;
        const room = Math.max(r.L - 2 * by, 0) * Math.max(r.W - 2 * by, 0);
        // A hole grown by `by`, inside the room (a hole at the edge is open past it: same area inside).
        const inHoles = holes
          .filter((h) => h.w > 0 && h.h > 0)
          .reduce(
            (n, h) =>
              n +
              (Math.min(h.x + h.w + by, r.L) - Math.max(h.x - by, 0)) *
                (Math.min(h.y + h.h + by, r.W) - Math.max(h.y - by, 0)),
            0,
          );
        const need = Math.ceil((room - inHoles) / (r.joint === 0 ? r.a * r.b : pu * pv) - 1e-9);
        expect(d.whole + d.cut).toBeGreaterThanOrEqual(need);
      }),
      { numRuns: 500 },
    );
  });

  it("no joint, no holes: the room 3 × 3 m with 30 × 30 tiles needs at least 100 pieces", () => {
    const d = diagonalGrid({
      lengthMm: 3000,
      widthMm: 3000,
      tileLengthMm: 300,
      tileWidthMm: 300,
      jointMm: 0,
      start: "corner",
      holes: [],
    });
    expect(d.whole + d.cut).toBeGreaterThanOrEqual(100);
  });
});

/** Re-review 2026-10-21: «Высота облицовки» is its own optional field; absent or 0 — tiled up to the ceiling. */
describe("tile height (tileHeightMm)", () => {
  const walls = { surface: "walls" as const };
  for (const tool of [plitka, klej, zatirka] as const) {
    it(`${tool.id}: absent = 0 = up to the walls' height; a lower band takes less`, () => {
      const base = { ...tool.defaults(ctx), ...walls } as Record<string, unknown>;
      const { tileHeightMm: _, ...absent } = base;
      const parsed = tool.input.safeParse(absent);
      expect(parsed.success).toBe(true);
      const area = (input: Record<string, unknown>) =>
        // biome-ignore lint/suspicious/noExplicitAny: one loop over three tools with their own input types
        tool.compute(tool.input.parse(input) as any, ctx).summary.find((s) => s.key === "area")?.value;
      expect(area(absent)).toBeCloseTo(area({ ...base, tileHeightMm: 0 }) ?? Number.NaN, 10);
      expect(area({ ...base, tileHeightMm: 9999 })).toBeCloseTo(area(base) ?? Number.NaN, 10);
      const low = tool.compute(tool.input.parse({ ...base, tileHeightMm: 1500 }) as never, ctx);
      expect(low.steps.find((s) => s.code === "band")?.values).toEqual({ band: 1.5, height: 2.7 });
      expect(low.summary.find((s) => s.key === "area")?.value ?? 0).toBeLessThan(area(base) ?? 0);
    });
  }
});
