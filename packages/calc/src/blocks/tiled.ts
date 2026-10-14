import type { Opening, Room, Step, Warning } from "../types";
import { mm2ToM2, mmToM, wallAreaM2 } from "./geometry";

/** What the adhesive and grout tools tile: the floor, the walls, or both with one tile (P17.5). */
export interface TiledSurfaceInput {
  surface: "floor" | "walls" | "both";
  shape: "rect" | "l";
  lengthMm: number;
  widthMm: number;
  cutLengthMm: number;
  cutWidthMm: number;
  heightMm: number;
  openings: readonly Opening[];
}

/**
 * The tiled area, m²: floor = length × width (− the L cut-out), walls = perimeter × height − openings (the walls keep
 * the rectangle's perimeter), both = their sum. Pushes the steps «Пол = …», «Стены = …», «Пол + стены = …» and the
 * warnings of a cut-out larger than the room or openings larger than the walls.
 */
export function tiledAreaM2(i: TiledSurfaceInput, warnings: Warning[], steps: Step[]): number {
  let floor = 0;
  let walls = 0;
  if (i.surface !== "walls") {
    let l = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
    if (l && (i.cutLengthMm >= i.lengthMm || i.cutWidthMm >= i.widthMm)) {
      warnings.push({ code: "cut_too_large", level: "warning" });
      l = false;
    }
    floor = mm2ToM2(i.lengthMm * i.widthMm - (l ? i.cutLengthMm * i.cutWidthMm : 0));
    steps.push(
      l
        ? {
            code: "floor_l",
            values: {
              length: mmToM(i.lengthMm),
              width: mmToM(i.widthMm),
              cutLength: mmToM(i.cutLengthMm),
              cutWidth: mmToM(i.cutWidthMm),
              area: floor,
            },
          }
        : { code: "floor", values: { length: mmToM(i.lengthMm), width: mmToM(i.widthMm), area: floor } },
    );
  }
  if (i.surface !== "floor") {
    const openings = i.openings.filter((o) => o.count > 0);
    const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
    const area = wallAreaM2(room);
    walls = Math.max(area.areaM2, 0);
    if (area.openingsExceedWalls) warnings.push({ code: "openings_exceed_walls", level: "warning" });
    steps.push({ code: "walls", values: { gross: area.grossM2, openings: area.openingsM2, area: walls } });
  }
  if (i.surface === "both") steps.push({ code: "both", values: { floor, walls, area: floor + walls } });
  return floor + walls;
}
