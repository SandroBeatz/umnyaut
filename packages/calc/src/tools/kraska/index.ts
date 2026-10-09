import { z } from "zod";
import { coverage, mm2ToM2, mmToM, purchase, purchaseSet, wallAreaM2 } from "../../blocks";
import type { PurchaseItem, Room, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.number().int().min(300).max(100_000);

const opening = z.object({
  type: z.enum(["door", "window"]),
  widthMm: z.number().int().min(100).max(10_000),
  heightMm: z.number().int().min(100).max(10_000),
  count: z.number().int().min(0).max(50),
});

const input = z.object({
  lengthMm: length,
  widthMm: length,
  heightMm: z.number().int().min(1000).max(10_000),
  openings: z.array(opening).max(20).readonly(),
  surface: z.enum(["walls", "ceiling", "both"]),
  /** Norm `paint.coats`. */
  coats: z.number().int().min(1).max(5),
  /** m² one litre covers in one coat, from the can (norm `paint.coverage`). */
  coverageM2PerL: z.number().min(1).max(30),
  /**
   * Can sizes the paint is sold in, whole millilitres (norm source S7: 0,9 / 2,7 / 9 л). Integers keep the
   * can-set search exact: `bestPackSet` works in 1/1000 of a litre.
   */
  cansMl: z.array(z.number().int().min(100).max(30_000)).min(1).max(6).readonly(),
  primer: z.boolean(),
  /** One coat, l/m² (norm `primer.consumption`). */
  primerRateLPerM2: z.number().min(0.05).max(1),
  /** Canister size, l: one size on purpose — a 1 l + 10 l optimiser by litres would pick 7 × 1 l over 10 l. */
  primerPackL: z.number().min(0.5).max(50),
});

export type KraskaInput = z.infer<typeof input>;

/**
 * Paint: area (walls without openings and/or ceiling) × coats ÷ coverage from the can; the cans are the set
 * of sizes with the least overbuy, then the fewest cans (`purchaseSet`). Primer: area × rate, one coat,
 * whole canisters. Ceiling = length × width (an L-shaped room is counted as its rectangle, like wall area).
 */
export const kraska: ToolModule<KraskaInput> = {
  id: "kraska",
  version: 1,
  input,
  defaults: () => ({
    lengthMm: 4600,
    widthMm: 4300,
    heightMm: 2700,
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
    ],
    surface: "walls",
    coats: 2,
    coverageM2PerL: 10,
    cansMl: [900, 2700, 9000],
    primer: true,
    primerRateLPerM2: 0.15,
    primerPackL: 10,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const steps: Step[] = [];
    const openings = i.openings.filter((o) => o.count > 0);
    const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
    const withWalls = i.surface !== "ceiling";
    const withCeiling = i.surface !== "walls";

    let wallsM2 = 0;
    if (withWalls) {
      const walls = wallAreaM2(room);
      wallsM2 = walls.areaM2;
      const tallest = Math.max(0, ...openings.map((o) => o.heightMm));
      if (tallest > i.heightMm) {
        warnings.push({
          code: "opening_too_tall",
          level: "warning",
          values: { height: mmToM(tallest), wall: mmToM(i.heightMm) },
        });
      }
      if (walls.openingsExceedWalls) warnings.push({ code: "openings_exceed_walls", level: "warning" });
      steps.push({
        code: "walls",
        values: {
          perimeter: mmToM(2 * (i.lengthMm + i.widthMm)),
          height: mmToM(i.heightMm),
          openings: walls.openingsM2,
          area: walls.areaM2,
        },
      });
    }
    const ceilingM2 = withCeiling ? mm2ToM2(i.lengthMm * i.widthMm) : 0;
    if (withCeiling) {
      steps.push({ code: "ceiling", values: { length: mmToM(i.lengthMm), width: mmToM(i.widthMm), area: ceilingM2 } });
    }
    const areaM2 = wallsM2 + ceilingM2;
    if (withWalls && withCeiling)
      steps.push({ code: "area", values: { walls: wallsM2, ceiling: ceilingM2, area: areaM2 } });
    if (!(areaM2 > 0)) return { items: [], summary: [], warnings, steps };

    const paintL = coverage({ areaM2, ratePerM2: 1 / i.coverageM2PerL, layers: i.coats });
    const items: PurchaseItem[] = purchaseSet(
      "paint",
      "main",
      { value: paintL, unit: "l" },
      "can",
      i.cansMl.map((ml) => ml / 1000),
    );
    steps.push({ code: "paint", values: { area: areaM2, coats: i.coats, coverage: i.coverageM2PerL, litres: paintL } });
    for (const line of items) steps.push({ code: "cans", values: { count: line.packs, size: line.pack.size.value } });

    const summary: ToolResult["summary"][number][] = [
      { key: "paintLitres", value: paintL, unit: "l" },
      { key: "area", value: areaM2, unit: "m2" },
    ];
    if (i.primer) {
      const primerL = coverage({ areaM2, ratePerM2: i.primerRateLPerM2 });
      const primer = purchase(
        "primer",
        "related",
        { value: primerL, unit: "l" },
        {
          kind: "canister",
          size: { value: i.primerPackL, unit: "l" },
        },
      );
      items.push(primer);
      summary.push({ key: "primerLitres", value: primerL, unit: "l" });
      steps.push({
        code: "primer",
        values: { area: areaM2, rate: i.primerRateLPerM2, litres: primerL, packs: primer.packs, size: i.primerPackL },
      });
    }

    return { items, summary, warnings, steps };
  },
};
