import { z } from "zod";
import { mm2ToM2, mmToM, purchase } from "../../blocks";
import type { Step, ToolModule, ToolResult } from "../../types";

const length = z.number().int().min(300).max(100_000);

const input = z.object({
  lengthMm: length,
  widthMm: length,
  /** 0 = pick the best of the standard widths; otherwise only this width. */
  rollWidthMm: z.union([z.literal(0), z.number().int().min(500).max(6000)]),
  /** Seam overlap for matching the pattern (norm `linoleum.seamOverlap`). */
  overlapMm: z.number().int().min(0).max(300),
  /** Extra on each room dimension for uneven walls; 0 — the room's largest length and width (Tarkett). */
  allowanceMm: z.number().int().min(0).max(300),
  /** Pattern repeat: each sheet after the first is cut up to one repeat longer to match the pattern. */
  repeatMm: z.number().int().min(0).max(2000),
  /** Shop cut step. */
  cutStepMm: z.number().int().min(10).max(1000),
});

export type LinoleumInput = z.infer<typeof input>;

/** Market roll widths (content plan C03: 1,5 … 4 м). */
export const LINOLEUM_WIDTHS_MM = [1500, 2000, 2500, 3000, 3500, 4000] as const;

interface Variant {
  widthMm: number;
  /** Sheets run along the room length. */
  alongLength: boolean;
  sheets: number;
  /** Bought length, mm, rounded to the cut step. */
  boughtMm: number;
  needMm: number;
  areaMm2: number;
}

function variant(widthMm: number, alongLength: boolean, i: LinoleumInput): Variant {
  const along = (alongLength ? i.lengthMm : i.widthMm) + i.allowanceMm;
  const across = (alongLength ? i.widthMm : i.lengthMm) + i.allowanceMm;
  const step = widthMm - i.overlapMm;
  const sheets = across <= widthMm || step <= 0 ? 1 : 1 + Math.ceil((across - widthMm) / step);
  const fits = step > 0 || across <= widthMm;
  const needMm = fits ? sheets * along + (sheets - 1) * i.repeatMm : Number.POSITIVE_INFINITY;
  const boughtMm = Math.ceil(needMm / i.cutStepMm) * i.cutStepMm;
  return { widthMm, alongLength, sheets, needMm, boughtMm, areaMm2: boughtMm * widthMm };
}

/** Fewest seams, then the smallest bought area (price is per m²), then along the room length. */
const better = (a: Variant, b: Variant) =>
  a.sheets - b.sheets ||
  a.areaMm2 - b.areaMm2 ||
  Number(b.alongLength) - Number(a.alongLength) ||
  a.widthMm - b.widthMm;

/**
 * Linoleum: every roll width × both directions; sheets so that n·w − (n − 1)·overlap covers the room across,
 * each as long as the room along; length bought to the shop's cut step. Tarkett: avoid seams with the widest
 * roll — so the fewest seams win, then the cheapest (smallest area). Rectangular room; an L-shape is bought
 * by its bounding rectangle.
 */
export const linoleum: ToolModule<LinoleumInput> = {
  id: "linoleum",
  version: 1,
  input,
  defaults: () => ({
    lengthMm: 4600,
    widthMm: 4300,
    rollWidthMm: 0,
    overlapMm: 50,
    allowanceMm: 0,
    repeatMm: 0,
    cutStepMm: 100,
  }),
  compute(i): ToolResult {
    const widths = i.rollWidthMm > 0 ? [i.rollWidthMm] : [...LINOLEUM_WIDTHS_MM];
    const variants = widths
      .flatMap((w) => [variant(w, true, i), variant(w, false, i)])
      .filter((v) => Number.isFinite(v.needMm))
      .sort(better);
    const best = variants[0] as Variant;
    const floorM2 = mm2ToM2(i.lengthMm * i.widthMm);
    // Bought by area: one cut step of this width is the pack, so packs = cut length / step.
    const item = purchase(
      "linoleum",
      "main",
      { value: mm2ToM2(best.needMm * best.widthMm), unit: "m2" },
      {
        kind: "running",
        size: { value: mm2ToM2(i.cutStepMm * best.widthMm), unit: "m2" },
        width: { value: mmToM(best.widthMm), unit: "m" },
      },
    );
    const boughtM2 = mm2ToM2(best.areaMm2);

    const steps: Step[] = [
      { code: "room", values: { length: mmToM(i.lengthMm), width: mmToM(i.widthMm), area: floorM2 } },
    ];
    if (i.allowanceMm > 0) steps.push({ code: "allowance", values: { allowance: mmToM(i.allowanceMm) } });
    for (const v of variants.slice(0, 4)) {
      steps.push({
        code: v.alongLength ? "variant_length" : "variant_width",
        values: { width: mmToM(v.widthMm), sheets: v.sheets, length: mmToM(v.boughtMm), area: mm2ToM2(v.areaMm2) },
      });
    }
    steps.push({
      code: "best",
      values: { width: mmToM(best.widthMm), seams: best.sheets - 1, length: mmToM(best.boughtMm), area: boughtM2 },
    });

    return {
      items: [item],
      summary: [
        { key: "length", value: mmToM(best.boughtMm), unit: "m" },
        { key: "width", value: mmToM(best.widthMm), unit: "m" },
        { key: "sheets", value: best.sheets, unit: "pcs" },
        { key: "seams", value: best.sheets - 1, unit: "pcs" },
        { key: "boughtArea", value: boughtM2, unit: "m2" },
        { key: "waste", value: Math.max(boughtM2 - floorM2, 0), unit: "m2" },
      ],
      warnings: best.sheets > 1 ? [{ code: "seams", level: "info", values: { seams: best.sheets - 1 } }] : [],
      steps,
    };
  },
};
