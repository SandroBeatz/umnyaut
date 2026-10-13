import * as z from "zod/mini";
import { cutCornerSchema, mm2ToM2, mmToM, openingInputSchema, planLayout, roomOutline, wallAreaM2 } from "../../blocks";
import type { Room, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.int().check(z.minimum(300), z.maximum(100_000));

/** Shared with every tool, so the plan places of openings survive between tools. */
const opening = openingInputSchema;

const input = z.object({
  lengthMm: length,
  widthMm: length,
  heightMm: z.int().check(z.minimum(1000), z.maximum(10_000)),
  shape: z.enum(["rect", "l"]),
  /** Corner cut-out of an L-shaped room and where it sits on the plan; ignored for a rectangle. */
  cutLengthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutWidthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutCorner: cutCornerSchema,
  openings: z.readonly(z.array(opening).check(z.maxLength(20))),
});

export type PloshchadStenInput = z.infer<typeof input>;

/**
 * Wall area: perimeter × height minus doors and windows; ceiling = floor. An L-shaped room has the same
 * perimeter as its bounding rectangle, so its walls are counted as the rectangle's; its ceiling loses the
 * cut-out (version 2). The picture is the room plan with the placed doors and windows; places change no area.
 */
export const ploshchadSten: ToolModule<PloshchadStenInput> = {
  id: "ploshchad-sten",
  version: 2,
  input,
  defaults: () => ({
    lengthMm: 4600,
    widthMm: 4300,
    heightMm: 2700,
    shape: "rect",
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    cutCorner: "se",
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
    // Whole millimetres first: 2 × (4,6 + 4,3) in metres gives 17,799999…
    const perimeter = mmToM(2 * (i.lengthMm + i.widthMm));
    // A cut-out as long or as wide as the room is not an L-shape; the room is counted as a rectangle.
    let l = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
    if (l && (i.cutLengthMm >= i.lengthMm || i.cutWidthMm >= i.widthMm)) {
      warnings.push({ code: "cut_too_large", level: "warning" });
      l = false;
    }
    const ceilingM2 = mm2ToM2(i.lengthMm * i.widthMm - (l ? i.cutLengthMm * i.cutWidthMm : 0));

    const tallest = Math.max(0, ...openings.map((o) => o.heightMm));
    if (tallest > i.heightMm) {
      warnings.push({ code: "opening_too_tall", level: "warning", values: { height: mmToM(tallest), wall: height } });
    }
    if (walls.openingsExceedWalls) warnings.push({ code: "openings_exceed_walls", level: "warning" });

    const outline = roomOutline(
      i.lengthMm,
      i.widthMm,
      l ? { lengthMm: i.cutLengthMm, widthMm: i.cutWidthMm } : undefined,
      i.cutCorner,
    );
    const { layout, off } = planLayout(outline, i.openings);
    if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });

    const steps: Step[] = [
      { code: l ? "perimeter_l" : "perimeter", values: { length, width, perimeter } },
      { code: "gross", values: { perimeter, height, area: walls.grossM2 } },
    ];
    if (openings.length > 0) {
      steps.push({
        code: "openings",
        values: { count: openings.reduce((n, o) => n + o.count, 0), area: walls.openingsM2 },
      });
      steps.push({ code: "net", values: { gross: walls.grossM2, openings: walls.openingsM2, area: walls.areaM2 } });
    }
    steps.push(
      l
        ? {
            code: "ceiling_l",
            values: { length, width, cutLength: mmToM(i.cutLengthMm), cutWidth: mmToM(i.cutWidthMm), area: ceilingM2 },
          }
        : { code: "ceiling", values: { length, width, area: ceilingM2 } },
    );

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
      layout,
    };
  },
};
