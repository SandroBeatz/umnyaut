import { z } from "zod";
import { mmToM, purchase } from "../../blocks";
import type { PurchaseItem, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.number().int().min(300).max(100_000);

const opening = z.object({
  type: z.enum(["door", "window"]),
  widthMm: z.number().int().min(100).max(10_000),
  heightMm: z.number().int().min(100).max(10_000),
  count: z.number().int().min(0).max(50),
});

const input = z.object({
  shape: z.enum(["rect", "l"]),
  lengthMm: length,
  widthMm: length,
  cutLengthMm: z.number().int().min(0).max(100_000),
  cutWidthMm: z.number().int().min(0).max(100_000),
  openings: z.array(opening).max(20).readonly(),
  /** Norm `plinth.length`. */
  plankLengthMm: z.number().int().min(1000).max(6000),
  /** Screw-and-dowel mounting; off for glue or tape. */
  fasteners: z.boolean(),
  /** Norm `plinth.fastenerSpacing` (Arbiton INDO manual: max 30–40 cm). */
  fastenerSpacingMm: z.number().int().min(100).max(1000),
});

export type PlintusInput = z.infer<typeof input>;

/**
 * Straight plinth runs: the walls (6 for an L-shape), each door put on the longest run left and splitting it
 * in two (a door mid-wall — the conservative case for fixings).
 */
function runs(i: PlintusInput, l: boolean): number[] {
  const walls = l
    ? [i.lengthMm, i.widthMm, i.lengthMm - i.cutLengthMm, i.cutWidthMm, i.cutLengthMm, i.widthMm - i.cutWidthMm]
    : [i.lengthMm, i.widthMm, i.lengthMm, i.widthMm];
  const pieces = [...walls];
  const doors = i.openings
    .filter((o) => o.type === "door" && o.count > 0)
    .flatMap((o) => Array.from({ length: o.count }, () => o.widthMm))
    .sort((a, b) => b - a);
  for (const door of doors) {
    const k = pieces.reduce((best, p, j) => (p > (pieces[best] as number) ? j : best), 0);
    const rest = Math.max((pieces[k] as number) - door, 0) / 2;
    pieces.splice(k, 1, rest, rest);
  }
  return pieces.filter((p) => p > 0);
}

const piece = (key: string, count: number): PurchaseItem =>
  purchase(key, "related", { value: count, unit: "pcs" }, { kind: "piece", size: { value: 1, unit: "pcs" } });

/**
 * Plinth: run = perimeter − door widths (an L-shape keeps the rectangle's perimeter); planks = ⌈run / plank⌉,
 * offcuts are joined with connectors, so joiners = planks − 1 (one per joint when laid around the room).
 * Inner corners 4 for a rectangle, 5 + 1 outer for an L-shape; two end caps per door.
 */
export const plintus: ToolModule<PlintusInput> = {
  id: "plintus",
  version: 1,
  input,
  defaults: () => ({
    shape: "rect",
    lengthMm: 4600,
    widthMm: 4300,
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
    ],
    plankLengthMm: 2500,
    fasteners: true,
    fastenerSpacingMm: 400,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    let l = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
    if (l && (i.cutLengthMm >= i.lengthMm || i.cutWidthMm >= i.widthMm)) {
      warnings.push({ code: "cut_too_large", level: "warning" });
      l = false;
    }
    const perimeterMm = 2 * (i.lengthMm + i.widthMm);
    const doors = i.openings.filter((o) => o.type === "door" && o.count > 0);
    const doorCount = doors.reduce((n, o) => n + o.count, 0);
    const doorsMm = doors.reduce((sum, o) => sum + o.widthMm * o.count, 0);
    const longestWallMm = Math.max(i.lengthMm, i.widthMm);
    if (doors.some((o) => o.widthMm > longestWallMm)) {
      warnings.push({ code: "door_wider_than_wall", level: "warning", values: { wall: mmToM(longestWallMm) } });
    }

    const steps: Step[] = [
      {
        code: "perimeter",
        values: { length: mmToM(i.lengthMm), width: mmToM(i.widthMm), perimeter: mmToM(perimeterMm) },
      },
    ];
    const runMm = perimeterMm - doorsMm;
    if (runMm <= 0) {
      warnings.push({ code: "doors_exceed_perimeter", level: "warning" });
      return { items: [], summary: [], warnings, steps };
    }
    if (doorsMm > 0) {
      steps.push({ code: "run", values: { perimeter: mmToM(perimeterMm), doors: mmToM(doorsMm), run: mmToM(runMm) } });
    }

    const plinth = purchase(
      "plinth",
      "main",
      { value: mmToM(runMm), unit: "m" },
      {
        kind: "plank",
        size: { value: mmToM(i.plankLengthMm), unit: "m" },
      },
    );
    const innerCorners = l ? 5 : 4;
    const outerCorners = l ? 1 : 0;
    const caps = 2 * doorCount;
    const joiners = Math.max(plinth.packs - 1, 0);
    const items = [
      plinth,
      piece("plinth-corner-in", innerCorners),
      ...(outerCorners > 0 ? [piece("plinth-corner-out", outerCorners)] : []),
      ...(caps > 0 ? [piece("plinth-cap", caps)] : []),
      ...(joiners > 0 ? [piece("plinth-joiner", joiners)] : []),
    ];
    if (i.fasteners) {
      // A fixing near both ends of every straight run, and no more than the spacing between them.
      const fasteners = runs(i, l).reduce((n, run) => n + Math.ceil(run / i.fastenerSpacingMm) + 1, 0);
      items.push(piece("plinth-fastener", fasteners));
      steps.push({
        code: "fasteners",
        values: { run: mmToM(runMm), spacing: mmToM(i.fastenerSpacingMm), count: fasteners },
      });
    }
    steps.push(
      { code: "planks", values: { run: mmToM(runMm), plank: mmToM(i.plankLengthMm), planks: plinth.packs } },
      { code: "corners", values: { inner: innerCorners, outer: outerCorners } },
    );
    if (caps > 0) steps.push({ code: "caps", values: { doors: doorCount, caps } });
    if (joiners > 0) steps.push({ code: "joiners", values: { planks: plinth.packs, joiners } });

    return {
      items,
      summary: [
        { key: "run", value: mmToM(runMm), unit: "m" },
        { key: "perimeter", value: mmToM(perimeterMm), unit: "m" },
      ],
      warnings,
      steps,
    };
  },
};
