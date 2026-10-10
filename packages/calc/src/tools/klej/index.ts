import { z } from "zod";
import { coverage, mm2ToM2, mmToM, purchase, wallAreaM2 } from "../../blocks";
import type { Room, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.number().int().min(300).max(100_000);

const opening = z.object({
  type: z.enum(["door", "window"]),
  widthMm: z.number().int().min(100).max(10_000),
  heightMm: z.number().int().min(100).max(10_000),
  count: z.number().int().min(0).max(50),
});

const input = z.object({
  surface: z.enum(["floor", "walls"]),
  shape: z.enum(["rect", "l"]),
  lengthMm: length,
  widthMm: length,
  /** Corner cut-out of an L-shaped floor (from “My room”); the walls keep the rectangle's perimeter. */
  cutLengthMm: z.number().int().min(0).max(100_000),
  cutWidthMm: z.number().int().min(0).max(100_000),
  heightMm: z.number().int().min(1000).max(10_000),
  openings: z.array(opening).max(20).readonly(),
  tileLengthMm: z.number().int().min(20).max(3000),
  tileWidthMm: z.number().int().min(20).max(3000),
  /** By the trowel notch for the tile size, or by a known layer thickness. */
  method: z.enum(["notch", "layer"]),
  layerMm: z.number().min(1).max(20),
  /** Norm `tileAdhesive.bag`. */
  bagKg: z.number().min(1).max(50),
  /** Combined method from 30 × 30: a thin layer on the tile back, mm (norm `tileAdhesive.backButter`, unconfirmed). */
  backButterMm: z.number().min(0).max(5),
});

export type KlejInput = z.infer<typeof input>;

/**
 * Trowel notch and kg/m² by the tile's longer side (Ceresit CM 11 PRO table; norms `tileAdhesive.notch*` —
 * the registry test keeps them equal). Beyond 60 cm the table says «от 5,5».
 */
export const NOTCH_TABLE: readonly { maxSideMm: number; notchMm: number; kgPerM2: number }[] = [
  { maxSideMm: 50, notchMm: 3, kgPerM2: 1.7 },
  { maxSideMm: 100, notchMm: 4, kgPerM2: 2.0 },
  { maxSideMm: 150, notchMm: 6, kgPerM2: 2.7 },
  { maxSideMm: 250, notchMm: 8, kgPerM2: 3.6 },
  { maxSideMm: 300, notchMm: 10, kgPerM2: 4.2 },
  { maxSideMm: 600, notchMm: 12, kgPerM2: 5.5 },
];
/** Norm `tileAdhesive.perMm`: kg/m² per 1 mm of layer at full coverage. */
const PER_MM = 1.2;
/** Datasheet limit on the layer. */
const MAX_LAYER_MM = 10;
/** From 30 × 30 cm the adhesive also goes on the tile back (combined method). */
const COMBINED_FROM_MM = 300;
/** From 60 × 60 the note becomes a warning: the table value is a bare minimum there. */
const LARGE_COMBINED_MM = 600;

/**
 * Tile adhesive: area (floor = length × width, walls = perimeter × height − openings) × kg/m² from the notch
 * table by the tile's longer side, or × 1,2 × layer mm (V = S × Vст × h); bags via `ceilPacks`.
 */
export const klej: ToolModule<KlejInput> = {
  id: "klej",
  version: 1,
  input,
  defaults: () => ({
    surface: "floor",
    shape: "rect",
    lengthMm: 4600,
    widthMm: 4300,
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    heightMm: 2700,
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
    ],
    tileLengthMm: 300,
    tileWidthMm: 300,
    method: "notch",
    layerMm: 3,
    bagKg: 25,
    backButterMm: 1,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const steps: Step[] = [];
    let areaM2: number;
    if (i.surface === "floor") {
      let l = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
      if (l && (i.cutLengthMm >= i.lengthMm || i.cutWidthMm >= i.widthMm)) {
        warnings.push({ code: "cut_too_large", level: "warning" });
        l = false;
      }
      areaM2 = mm2ToM2(i.lengthMm * i.widthMm - (l ? i.cutLengthMm * i.cutWidthMm : 0));
      steps.push(
        l
          ? {
              code: "floor_l",
              values: {
                length: mmToM(i.lengthMm),
                width: mmToM(i.widthMm),
                cutLength: mmToM(i.cutLengthMm),
                cutWidth: mmToM(i.cutWidthMm),
                area: areaM2,
              },
            }
          : { code: "floor", values: { length: mmToM(i.lengthMm), width: mmToM(i.widthMm), area: areaM2 } },
      );
    } else {
      const openings = i.openings.filter((o) => o.count > 0);
      const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
      const walls = wallAreaM2(room);
      areaM2 = walls.areaM2;
      if (walls.openingsExceedWalls) warnings.push({ code: "openings_exceed_walls", level: "warning" });
      steps.push({ code: "walls", values: { gross: walls.grossM2, openings: walls.openingsM2, area: areaM2 } });
    }
    if (!(areaM2 > 0)) return { items: [], summary: [], warnings, steps };

    const sideMm = Math.max(i.tileLengthMm, i.tileWidthMm);
    const row =
      NOTCH_TABLE.find((r) => sideMm <= r.maxSideMm) ??
      (NOTCH_TABLE[NOTCH_TABLE.length - 1] as (typeof NOTCH_TABLE)[number]);
    let rate: number;
    if (i.method === "layer") {
      rate = PER_MM * i.layerMm;
      if (i.layerMm > MAX_LAYER_MM) {
        warnings.push({ code: "layer_too_thick", level: "warning", values: { layer: i.layerMm, max: MAX_LAYER_MM } });
      }
      steps.push({ code: "rate_layer", values: { perMm: PER_MM, layer: i.layerMm, rate } });
    } else {
      rate = row.kgPerM2;
      steps.push({ code: "rate_notch", values: { side: row.maxSideMm / 10, notch: row.notchMm, rate } });
    }
    // Tile-size notes apply to both methods: the datasheet rate is a minimum («от») for big tiles.
    const shortSideMm = Math.min(i.tileLengthMm, i.tileWidthMm);
    if (sideMm > row.maxSideMm) {
      warnings.push({ code: "large_format", level: "warning", values: { rate: row.kgPerM2 } });
    } else if (shortSideMm >= COMBINED_FROM_MM) {
      warnings.push({
        code: "combined_method",
        level: shortSideMm >= LARGE_COMBINED_MM ? "warning" : "info",
        values: { layer: i.backButterMm },
      });
    }
    // Combined method: the datasheet rate is the trowelled base; the tile back gets 1,2 kg/m² per mm on top.
    if (shortSideMm >= COMBINED_FROM_MM && i.backButterMm > 0) {
      const extra = PER_MM * i.backButterMm;
      steps.push({ code: "back_butter", values: { layer: i.backButterMm, perMm: PER_MM, extra, rate: rate + extra } });
      rate += extra;
    }

    const kg = coverage({ areaM2, ratePerM2: rate });
    const item = purchase(
      "tile-adhesive",
      "main",
      { value: kg, unit: "kg" },
      {
        kind: "bag",
        size: { value: i.bagKg, unit: "kg" },
      },
    );
    steps.push({ code: "adhesive", values: { area: areaM2, rate, kg, bag: i.bagKg, bags: item.packs } });

    return {
      items: [item],
      summary: [
        { key: "adhesiveKg", value: kg, unit: "kg" },
        { key: "area", value: areaM2, unit: "m2" },
        ...(i.method === "notch" ? [{ key: "notch", value: row.notchMm, unit: "mm" as const }] : []),
      ],
      warnings,
      steps,
    };
  },
};
