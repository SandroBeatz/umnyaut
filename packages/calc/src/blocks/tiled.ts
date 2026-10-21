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
  /** The room's wall height (bound to “My room”). */
  heightMm: number;
  /** «Высота облицовки»: tiled from the floor up to it; absent or 0 — up to the ceiling (`heightMm`). */
  tileHeightMm?: number | undefined;
  openings: readonly Opening[];
}

/**
 * The tiled band on the walls, mm: from the floor up to `tileHeightMm` when it is set (an apron, a half-height
 * bathroom), never above the room's walls; absent or 0 — the whole wall height.
 */
export function tiledBandMm(i: Pick<TiledSurfaceInput, "heightMm" | "tileHeightMm">): number {
  return i.tileHeightMm !== undefined && i.tileHeightMm > 0 ? Math.min(i.tileHeightMm, i.heightMm) : i.heightMm;
}

/**
 * The tiled area, m²: floor = length × width (− the L cut-out), walls = perimeter × band − the parts of the doors
 * and windows inside the band from the floor up (`tiledBandMm`, `wallAreaM2` «band»; the walls keep the rectangle's
 * perimeter), both = their sum. Pushes the steps «Пол = …», «Облицовка до …», «Стены = …», «Пол + стены = …» and
 * the warnings of a cut-out larger than the room or openings larger than the walls.
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
    const band = tiledBandMm(i);
    if (band < i.heightMm) steps.push({ code: "band", values: { band: mmToM(band), height: mmToM(i.heightMm) } });
    const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: band, openings };
    // Tiled from the floor up to the band's top: a door or a window counts only inside it.
    const area = wallAreaM2(room, "band");
    walls = Math.max(area.areaM2, 0);
    if (area.openingsExceedWalls) warnings.push({ code: "openings_exceed_walls", level: "warning" });
    steps.push({ code: "walls", values: { gross: area.grossM2, openings: area.openingsM2, area: walls } });
  }
  if (i.surface === "both") steps.push({ code: "both", values: { floor, walls, area: floor + walls } });
  return floor + walls;
}
