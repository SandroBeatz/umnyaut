import * as z from "zod/mini";
import {
  cornerFlips,
  cutCornerSchema,
  lightDirection,
  mm2ToM2,
  mmToM,
  openingInputSchema,
  placeOpenings,
  purchase,
  roomOutline,
  seamInDoor,
  sheetsLayout,
} from "../../blocks";
import type { Layout, LayoutMark, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.int().check(z.minimum(300), z.maximum(100_000));

const input = z.object({
  shape: z.enum(["rect", "l"]),
  lengthMm: length,
  widthMm: length,
  /** Corner cut-out of an L-shaped room (from “My room”). */
  cutLengthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutWidthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  /** Where the cut-out sits on the plan (scheme only). */
  cutCorner: cutCornerSchema,
  /** Doors and windows; only their places on the plan are used (scheme and laying guide). */
  openings: z.readonly(z.array(openingInputSchema).check(z.maxLength(20))),
  /** 0 = pick the best of the standard widths; otherwise only this width. */
  rollWidthMm: z.union([z.literal(0), z.int().check(z.minimum(500), z.maximum(6000))]),
  /** Seam overlap for matching the pattern (norm `linoleum.seamOverlap`). */
  overlapMm: z.int().check(z.minimum(0), z.maximum(300)),
  /** Extra on each room dimension for uneven walls; 0 — the room's largest length and width (Tarkett). */
  allowanceMm: z.int().check(z.minimum(0), z.maximum(300)),
  /** The linoleum has a pattern to match: only then the repeat counts. */
  pattern: z.boolean(),
  /** Pattern repeat: each sheet after the first is cut up to one repeat longer to match the pattern. */
  repeatMm: z.int().check(z.minimum(0), z.maximum(2000)),
  /** Seam welding: metres of seam one tube closes (norm `linoleum.weldPerTube`, unconfirmed). */
  weld: z.boolean(),
  weldPerTubeM: z.number().check(z.minimum(1), z.maximum(100)),
  /** Shop cut step. */
  cutStepMm: z.int().check(z.minimum(10), z.maximum(1000)),
});

export type LinoleumInput = z.infer<typeof input>;

/** Norm `linoleum.wallTrim`: gap left at the walls when trimming. */
export const LINOLEUM_WALL_TRIM_MM = 10;

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
  /** Cut length of each sheet in laying order, mm; they add up to `needMm`. */
  lengths: number[];
  /** Sheets wholly in the L-shape's cut-out band. */
  short: boolean[];
  cut?: { along: number; across: number };
}

/** The cut-out if it makes a real L-shape (smaller than the room both ways), else none. */
const cutOf = (i: LinoleumInput) =>
  i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0 && i.cutLengthMm < i.lengthMm && i.cutWidthMm < i.widthMm
    ? { along: i.cutLengthMm, across: i.cutWidthMm }
    : undefined;

function variant(widthMm: number, alongLength: boolean, i: LinoleumInput): Variant {
  const along = (alongLength ? i.lengthMm : i.widthMm) + i.allowanceMm;
  const across = (alongLength ? i.widthMm : i.lengthMm) + i.allowanceMm;
  const step = widthMm - i.overlapMm;
  const sheets = across <= widthMm || step <= 0 ? 1 : 1 + Math.ceil((across - widthMm) / step);
  const fits = step > 0 || across <= widthMm;
  // L-shape: sheets lying wholly inside the cut-out band (the last ones, laid from the full side) are shorter.
  const cut = cutOf(i);
  const cutAlong = cut ? (alongLength ? cut.along : cut.across) : 0;
  const bandFrom = cut ? (alongLength ? i.widthMm - cut.across : i.lengthMm - cut.along) : Number.POSITIVE_INFINITY;
  // A sheet's floor part starts at its seam: unrolled at −allowance / 2 + j × step, cut mid-overlap.
  const short = Array.from(
    { length: sheets },
    (_, j) => j > 0 && j * step - i.allowanceMm / 2 + i.overlapMm / 2 >= bandFrom,
  );
  const lengths = short.map((s, j) => along - (s ? cutAlong : 0) + (j > 0 ? i.repeatMm : 0));
  const needMm = fits ? lengths.reduce((sum, l) => sum + l, 0) : Number.POSITIVE_INFINITY;
  const boughtMm = Math.ceil(needMm / i.cutStepMm) * i.cutStepMm;
  return {
    widthMm,
    alongLength,
    sheets,
    needMm,
    boughtMm,
    areaMm2: boughtMm * widthMm,
    lengths,
    short,
    cut: cut ? { along: cutAlong, across: alongLength ? cut.across : cut.along } : undefined,
  };
}

/** Fewest seams, then the smallest bought area (price is per m²), then along the room length. */
const better = (a: Variant, b: Variant) =>
  a.sheets - b.sheets ||
  a.areaMm2 - b.areaMm2 ||
  Number(b.alongLength) - Number(a.alongLength) ||
  a.widthMm - b.widthMm;

/**
 * Scheme and laying guide from the very variant the purchase was counted on. Canonical frame: sheet 1 at the
 * start wall, the L-cut at the far end of the last sheets; mirrored to the plan's cut corner. A rectangle is
 * mirrored across the sheets when that keeps every seam out of the doorways.
 */
function scheme(i: LinoleumInput, best: Variant, variants: readonly Variant[], warnings: Warning[]): Layout {
  const cut = cutOf(i);
  const outline = roomOutline(
    i.lengthMm,
    i.widthMm,
    cut ? { lengthMm: cut.along, widthMm: cut.across } : undefined,
    i.cutCorner,
  );
  const { placed, off } = placeOpenings(outline.walls, i.openings);
  if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });
  const doors = placed.filter((p) => p.type === "door").map((p) => p.mark);
  const lay = (flipX: boolean, flipY: boolean) => {
    const laid = sheetsLayout({
      lengthMm: i.lengthMm,
      widthMm: i.widthMm,
      alongLength: best.alongLength,
      rollWidthMm: best.widthMm,
      overlapMm: i.overlapMm,
      allowanceMm: i.allowanceMm,
      lengthsMm: best.lengths,
      short: best.short,
      cut: best.cut,
      flipX,
      flipY,
      walls: outline.walls,
    });
    const inDoor = laid.seams.some((seam) => doors.some((door) => seamInDoor(seam, door)));
    return { ...laid, inDoor };
  };
  const flips = cut ? cornerFlips(i.cutCorner) : { x: false, y: false };
  let laid = lay(flips.x, flips.y);
  let moved = false;
  if (!cut && laid.inDoor) {
    const other = lay(!best.alongLength, best.alongLength);
    if (!other.inDoor) {
      laid = other;
      moved = true;
    }
  }

  const seams = best.sheets - 1;
  const guide: Step[] = [
    { code: "start", values: { wall: laid.startWall + 1, width: mmToM(best.widthMm) } },
    { code: "relax", values: {} },
  ];
  if (seams > 0) {
    guide.push({ code: i.overlapMm > 0 ? "seam_overlap" : "seam_butt", values: { overlap: i.overlapMm / 10 } });
    if (i.repeatMm > 0) guide.push({ code: "repeat", values: { repeat: i.repeatMm / 10 } });
    if (i.weld) guide.push({ code: "weld", values: {} });
  }
  const shortCount = best.short.filter(Boolean).length;
  if (shortCount > 0) guide.push({ code: "short", values: { count: shortCount } });
  guide.push({ code: "trim", values: { trim: LINOLEUM_WALL_TRIM_MM } });
  if (seams > 0) {
    if (moved) guide.push({ code: "door_clear", values: {} });
    else if (laid.inDoor) guide.push({ code: "seam_door", values: {} });
    const light = lightDirection(
      outline.walls,
      placed.filter((p) => p.type === "window"),
    );
    const direction = best.alongLength ? "length" : "width";
    if (light === direction) guide.push({ code: "light_along", values: {} });
    else if (light) {
      const along = variants.find((v) => v.alongLength === (light === "length"));
      guide.push(
        along
          ? {
              code: "light_across",
              values: { width: mmToM(along.widthMm), seams: along.sheets - 1, area: mm2ToM2(along.areaMm2) },
            }
          : { code: "light_across_only", values: {} },
      );
    }
    if (placed.length === 0) guide.push({ code: "place_openings", values: {} });
  }

  const marks: LayoutMark[] = [laid.start, ...laid.seams, ...placed.map((p) => p.mark)];
  const cutPieces = laid.pieces.filter((p) => p.cut).length;
  return {
    kind: "strips",
    widthMm: i.lengthMm,
    heightMm: i.widthMm,
    outline: outline.points,
    walls: outline.walls,
    pieces: laid.pieces,
    marks,
    sheets: laid.sheets,
    guide,
    stats: {
      whole: laid.pieces.length - cutPieces,
      cut: cutPieces,
      reused: 0,
      wasteM2: mm2ToM2(best.areaMm2 - (i.lengthMm * i.widthMm - (cut ? cut.along * cut.across : 0))),
    },
  };
}

/**
 * Linoleum: every roll width × both directions; sheets so that n·w − (n − 1)·overlap covers the room across,
 * each as long as the room along; length bought to the shop's cut step. Tarkett: avoid seams with the widest
 * roll — so the fewest seams win, then the cheapest (smallest area). Rectangular room; an L-shape is bought
 * by its bounding rectangle.
 */
export const linoleum: ToolModule<LinoleumInput> = {
  id: "linoleum",
  // 2: a sheet is short only when its seam lies in the L-shape's narrow part (allowance shift counted).
  // 3: the repeat counts only with «Рисунок» on (owner, 2026-10-14) — a repeat left in a hidden field adds nothing.
  version: 3,
  input,
  defaults: () => ({
    shape: "rect",
    lengthMm: 4600,
    widthMm: 4300,
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    cutCorner: "se",
    // The example plan of every floor tool: door in the bottom wall, window in the left one.
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 3, offsetMm: 1550 }] },
    ],
    rollWidthMm: 0,
    overlapMm: 50,
    allowanceMm: 0,
    pattern: false,
    repeatMm: 0,
    weld: true,
    weldPerTubeM: 20,
    cutStepMm: 100,
  }),
  compute(i): ToolResult {
    i = { ...i, repeatMm: i.pattern ? i.repeatMm : 0 };
    const widths = i.rollWidthMm > 0 ? [i.rollWidthMm] : [...LINOLEUM_WIDTHS_MM];
    const variants = widths
      .flatMap((w) => [variant(w, true, i), variant(w, false, i)])
      .filter((v) => Number.isFinite(v.needMm))
      .sort(better);
    const best = variants[0] as Variant;
    const cut = cutOf(i);
    const floorM2 = mm2ToM2(i.lengthMm * i.widthMm - (cut ? cut.along * cut.across : 0));
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
    const items = [item];
    // Cold welding: each seam counted along the longer side of the room — the safe side whichever way the
    // sheets run (and it never drops when the room grows).
    const seamM = (best.sheets - 1) * mmToM(Math.max(i.lengthMm, i.widthMm));
    if (i.weld && seamM > 0) {
      items.push(
        purchase(
          "seam-weld",
          "related",
          { value: seamM, unit: "m" },
          {
            kind: "tube",
            size: { value: i.weldPerTubeM, unit: "m" },
          },
        ),
      );
    }

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

    const warnings: Warning[] =
      best.sheets > 1
        ? [{ code: i.weld ? "seams" : "seams_no_weld", level: "info", values: { seams: best.sheets - 1 } }]
        : [];
    if (i.shape === "l" && !cut && i.cutLengthMm > 0 && i.cutWidthMm > 0) {
      warnings.push({ code: "cut_too_large", level: "warning" });
    }
    const layout = scheme(i, best, variants, warnings);

    return {
      items,
      summary: [
        { key: "length", value: mmToM(best.boughtMm), unit: "m" },
        { key: "width", value: mmToM(best.widthMm), unit: "m" },
        { key: "sheets", value: best.sheets, unit: "pcs" },
        { key: "seams", value: best.sheets - 1, unit: "pcs" },
        { key: "boughtArea", value: boughtM2, unit: "m2" },
        { key: "waste", value: Math.max(boughtM2 - floorM2, 0), unit: "m2" },
        { key: "floorArea", value: floorM2, unit: "m2" },
      ],
      warnings,
      steps,
      layout,
    };
  },
};
