import { z } from "zod";
import { floorAreaM2, mm2ToM2, mmToM, perimeterMm } from "../../blocks";
import type { Room, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.number().int().min(300).max(100_000);
const optional = z.number().int().min(0).max(20_000);

const input = z.object({
  shape: z.enum(["rect", "l"]),
  lengthMm: length,
  widthMm: length,
  /** Corner cut-out of an L-shaped room; ignored for a rectangle. */
  cutLengthMm: z.number().int().min(0).max(100_000),
  cutWidthMm: z.number().int().min(0).max(100_000),
  /** Niche: adds its area; its two side walls add 2 × depth to the perimeter. */
  nicheLengthMm: optional,
  nicheDepthMm: optional,
  /** Protrusion (column, duct box) against a wall: removes its area, adds 2 × depth to the perimeter. */
  protrusionLengthMm: optional,
  protrusionDepthMm: optional,
});

export type PloshchadKomnatyInput = z.infer<typeof input>;

/**
 * Room floor area and perimeter: rectangle, L-shape (rectangle minus a corner cut-out), plus a niche and
 * minus a protrusion. Writes “My room”. No purchase items: the summary is the result.
 */
export const ploshchadKomnaty: ToolModule<PloshchadKomnatyInput> = {
  id: "ploshchad-komnaty",
  version: 1,
  input,
  defaults: () => ({
    shape: "rect",
    lengthMm: 4600,
    widthMm: 4300,
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    nicheLengthMm: 0,
    nicheDepthMm: 0,
    protrusionLengthMm: 0,
    protrusionDepthMm: 0,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const steps: Step[] = [];
    const length = mmToM(i.lengthMm);
    const width = mmToM(i.widthMm);

    // A cut-out as long or as wide as the room is not an L-shape; the room is counted as a rectangle.
    let l = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
    if (l && (i.cutLengthMm >= i.lengthMm || i.cutWidthMm >= i.widthMm)) {
      warnings.push({ code: "cut_too_large", level: "warning" });
      l = false;
    }
    const room: Room = {
      shape: l ? "l" : "rect",
      lengthMm: i.lengthMm,
      widthMm: i.widthMm,
      heightMm: 0,
      ...(l && { cut: { lengthMm: i.cutLengthMm, widthMm: i.cutWidthMm } }),
      openings: [],
    };
    const baseM2 = floorAreaM2(room);
    const basePerimeterMm = perimeterMm(room);
    let perimeter = basePerimeterMm;
    if (l) {
      const cut = mm2ToM2(i.cutLengthMm * i.cutWidthMm);
      steps.push({
        code: "area_l",
        values: { length, width, cutLength: mmToM(i.cutLengthMm), cutWidth: mmToM(i.cutWidthMm), cut, area: baseM2 },
      });
    } else {
      steps.push({ code: "area_rect", values: { length, width, area: baseM2 } });
    }

    let areaM2 = baseM2;
    if (i.nicheLengthMm > 0 && i.nicheDepthMm > 0) {
      const niche = mm2ToM2(i.nicheLengthMm * i.nicheDepthMm);
      areaM2 += niche;
      perimeter += 2 * i.nicheDepthMm;
      steps.push({
        code: "niche",
        values: { length: mmToM(i.nicheLengthMm), depth: mmToM(i.nicheDepthMm), area: niche },
      });
    }
    if (i.protrusionLengthMm > 0 && i.protrusionDepthMm > 0) {
      const protrusion = mm2ToM2(i.protrusionLengthMm * i.protrusionDepthMm);
      if (protrusion >= areaM2) warnings.push({ code: "protrusion_too_large", level: "warning" });
      areaM2 = Math.max(areaM2 - protrusion, 0);
      perimeter += 2 * i.protrusionDepthMm;
      steps.push({
        code: "protrusion",
        values: { length: mmToM(i.protrusionLengthMm), depth: mmToM(i.protrusionDepthMm), area: protrusion },
      });
    }
    if (areaM2 !== baseM2) steps.push({ code: "area_total", values: { area: areaM2 } });

    // An L-shape keeps the perimeter of its bounding rectangle, so both shapes share 2 × (L + W).
    steps.push({
      code: l ? "perimeter_l" : "perimeter",
      values: { length, width, perimeter: mmToM(basePerimeterMm) },
    });
    const perimeterM = mmToM(perimeter);
    if (perimeter !== basePerimeterMm) {
      steps.push({
        code: "perimeter_total",
        values: { extra: mmToM(perimeter - basePerimeterMm), perimeter: perimeterM },
      });
    }

    return {
      items: [],
      summary: [
        { key: "floorArea", value: areaM2, unit: "m2" },
        { key: "perimeter", value: perimeterM, unit: "m" },
      ],
      warnings,
      steps,
    };
  },
};
