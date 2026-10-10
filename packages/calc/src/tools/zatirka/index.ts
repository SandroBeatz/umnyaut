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
  /** Norms `tile.joint.floor` / `tile.joint.wall`. */
  jointMm: z.number().min(0.5).max(20),
  /** Joint depth = tile thickness. */
  depthMm: z.number().min(1).max(30),
  /** Norm `grout.reserve`. */
  reservePct: z.number().min(0).max(30),
  packKg: z.number().min(0.5).max(25),
});

export type ZatirkaInput = z.infer<typeof input>;

/** Norm `grout.density`, kg/dm³ (Ceresit; owner's choice over Mapei's ≈ 1,5). */
export const GROUT_DENSITY = 1.6;
const shape = (a: number, b: number) => (a + b) / (a * b);

/** Joint range the grout is made for (CE 40: 1–10 mm). */
const MIN_JOINT_MM = 1;
const MAX_JOINT_MM = 10;

/**
 * Grout: kg/m² = (A + B) / (A × B) × joint × depth × 1,6 (Ceresit formula, A × B tile in mm); total = area ×
 * rate × (1 + reserve); packs via `ceilPacks`. Area as for tile adhesive: floor or walls without openings.
 */
export const zatirka: ToolModule<ZatirkaInput> = {
  id: "zatirka",
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
    jointMm: 3,
    depthMm: 8,
    reservePct: 10,
    packKg: 2,
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
    if (i.jointMm < MIN_JOINT_MM) {
      warnings.push({ code: "joint_too_narrow", level: "warning", values: { joint: i.jointMm, min: MIN_JOINT_MM } });
    }
    if (i.jointMm > MAX_JOINT_MM) {
      warnings.push({ code: "joint_too_wide", level: "warning", values: { joint: i.jointMm, max: MAX_JOINT_MM } });
    }

    const a = i.tileLengthMm;
    const b = i.tileWidthMm;
    // The CE 40 table (S18) agrees with this formula at its own joint depth (12,5–14 mm for large porcelain,
    // ≈ 6 mm for small tiles), so the real tile thickness is what matters — golden cross-checks both.
    const rate = shape(a, b) * i.jointMm * i.depthMm * GROUT_DENSITY;
    const kg = coverage({ areaM2, ratePerM2: rate, wastePct: i.reservePct });
    const grout = purchase(
      "grout",
      "main",
      { value: kg, unit: "kg" },
      {
        kind: "pack",
        size: { value: i.packKg, unit: "kg" },
      },
    );
    steps.push(
      {
        code: "rate",
        values: { a, b, joint: i.jointMm, depth: i.depthMm, density: GROUT_DENSITY, rate },
      },
      { code: "grout", values: { area: areaM2, rate, reserve: i.reservePct, kg, pack: i.packKg, packs: grout.packs } },
    );

    return {
      items: [grout],
      summary: [
        { key: "groutKg", value: kg, unit: "kg" },
        { key: "rate", value: rate, unit: "kg" },
        { key: "area", value: areaM2, unit: "m2" },
      ],
      warnings,
      steps,
    };
  },
};
