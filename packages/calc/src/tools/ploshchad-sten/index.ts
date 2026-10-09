import { z } from "zod";
import { mm2ToM2, mmToM, wallAreaM2 } from "../../blocks";
import type { Room, Step, ToolModule, ToolResult, Warning } from "../../types";

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
});

export type PloshchadStenInput = z.infer<typeof input>;

/**
 * Wall area: perimeter × height minus doors and windows; ceiling = floor. An L-shaped room has the same
 * perimeter as its bounding rectangle, so length × width covers both shapes.
 */
export const ploshchadSten: ToolModule<PloshchadStenInput> = {
  id: "ploshchad-sten",
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
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const openings = i.openings.filter((o) => o.count > 0);
    const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
    const walls = wallAreaM2(room);
    const length = mmToM(i.lengthMm);
    const width = mmToM(i.widthMm);
    const height = mmToM(i.heightMm);
    const perimeter = 2 * (length + width);
    const ceilingM2 = mm2ToM2(i.lengthMm * i.widthMm);

    const tallest = Math.max(0, ...openings.map((o) => o.heightMm));
    if (tallest > i.heightMm) {
      warnings.push({ code: "opening_too_tall", level: "warning", values: { height: mmToM(tallest), wall: height } });
    }
    if (walls.openingsExceedWalls) warnings.push({ code: "openings_exceed_walls", level: "warning" });

    const steps: Step[] = [
      { code: "perimeter", values: { length, width, perimeter } },
      { code: "gross", values: { perimeter, height, area: walls.grossM2 } },
    ];
    if (openings.length > 0) {
      steps.push({
        code: "openings",
        values: { count: openings.reduce((n, o) => n + o.count, 0), area: walls.openingsM2 },
      });
      steps.push({ code: "net", values: { gross: walls.grossM2, openings: walls.openingsM2, area: walls.areaM2 } });
    }
    steps.push({ code: "ceiling", values: { length, width, area: ceilingM2 } });

    return {
      items: [],
      summary: [
        { key: "wallArea", value: walls.areaM2, unit: "m2" },
        { key: "grossWallArea", value: walls.grossM2, unit: "m2" },
        { key: "openingsArea", value: walls.openingsM2, unit: "m2" },
        { key: "ceilingArea", value: ceilingM2, unit: "m2" },
        { key: "perimeter", value: perimeter, unit: "m" },
      ],
      warnings,
      steps,
    };
  },
};
