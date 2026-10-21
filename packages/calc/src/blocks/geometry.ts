import type { Opening, Room } from "../types";
import { WINDOW_SILL_MM } from "./plan";

/** mm² → m². Lengths stay integer millimetres; only the final area becomes a float. */
export const mm2ToM2 = (mm2: number) => mm2 / 1_000_000;
export const mmToM = (mm: number) => mm / 1000;

type Point = readonly [number, number];

/** Shoelace area of a simple polygon in mm², always positive whatever the winding. */
export function polygonAreaMm2(points: readonly Point[]): number {
  let twice = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i] as Point;
    const [x2, y2] = points[(i + 1) % points.length] as Point;
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}

export function polygonPerimeterMm(points: readonly Point[]): number {
  if (points.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i] as Point;
    const [x2, y2] = points[(i + 1) % points.length] as Point;
    sum += Math.hypot(x2 - x1, y2 - y1);
  }
  return sum;
}

/** The cut-out can't exceed the room; anything larger is clamped so the area never goes negative. */
function clampedCut(room: Room) {
  if (room.shape !== "l" || !room.cut) return { lengthMm: 0, widthMm: 0 };
  return {
    lengthMm: Math.min(Math.max(room.cut.lengthMm, 0), room.lengthMm),
    widthMm: Math.min(Math.max(room.cut.widthMm, 0), room.widthMm),
  };
}

/**
 * Floor (= ceiling) area in m².
 * rect: L × W; L-shape: L × W − cut (corner cut-out); polygon: shoelace over `points` (falls back to rect without them).
 */
export function floorAreaM2(room: Room): number {
  if (room.shape === "polygon" && room.points && room.points.length >= 3) return mm2ToM2(polygonAreaMm2(room.points));
  const cut = clampedCut(room);
  return mm2ToM2(room.lengthMm * room.widthMm - cut.lengthMm * cut.widthMm);
}

/**
 * Floor perimeter in mm. A corner cut-out keeps the perimeter of the bounding rectangle
 * (the two inner edges replace exactly the removed outer ones), so rect and L share 2 × (L + W).
 */
export function perimeterMm(room: Room): number {
  if (room.shape === "polygon" && room.points && room.points.length >= 3) return polygonPerimeterMm(room.points);
  return 2 * (room.lengthMm + room.widthMm);
}

/** Σ width × height × count of openings, in m². */
export function openingsAreaM2(openings: readonly Opening[]): number {
  return mm2ToM2(openings.reduce((sum, o) => sum + o.widthMm * o.heightMm * o.count, 0));
}

/**
 * How the openings are cut by the wall: `height` — an opening taller than the wall is held at the wall's height
 * (a door 2,6 m on a 2,5 m wall takes 2,5 m of it); `band` — the wall is tiled only from the floor up to
 * `heightMm` (an apron, a half-height bathroom): a door takes what of it lies under the band's top, a window only
 * the part between its sill (`WINDOW_SILL_MM` when not placed or set) and the top.
 */
export type OpeningClip = "none" | "height" | "band";

/** The height of one opening inside the wall [0, `heightMm`] from the floor, mm, for a window on `sillMm`. */
export function openingHeightInMm(
  o: Pick<Opening, "type" | "heightMm">,
  heightMm: number,
  clip: OpeningClip,
  sillMm = WINDOW_SILL_MM,
): number {
  if (clip === "none") return o.heightMm;
  if (clip === "height" || o.type === "door") return Math.min(o.heightMm, heightMm);
  const sill = Math.max(sillMm, 0);
  return Math.max(Math.min(sill + o.heightMm, heightMm) - Math.min(sill, heightMm), 0);
}

/** Σ width × height inside the wall × count, in m²; a placed window takes its own sill, the rest the default. */
export function clippedOpeningsAreaM2(openings: readonly Opening[], heightMm: number, clip: OpeningClip): number {
  let mm2 = 0;
  for (const o of openings) {
    const places = (o.places ?? []).slice(0, Math.max(o.count, 0));
    for (const p of places) mm2 += o.widthMm * openingHeightInMm(o, heightMm, clip, p.sillMm ?? WINDOW_SILL_MM);
    mm2 += o.widthMm * openingHeightInMm(o, heightMm, clip) * Math.max(o.count - places.length, 0);
  }
  return mm2ToM2(mm2);
}

/** Total door width in mm — plinth is not laid across doorways. */
export function doorWidthMm(openings: readonly Opening[]): number {
  return openings.filter((o) => o.type === "door").reduce((sum, o) => sum + o.widthMm * o.count, 0);
}

/** Gross wall area (perimeter × height) in m², before openings. */
export function grossWallAreaM2(room: Room): number {
  return mm2ToM2(perimeterMm(room) * room.heightMm);
}

/**
 * Net wall area in m²: perimeter × height − openings, never below zero. `clip` (default `none`, the openings as
 * given) holds them inside the wall — see `OpeningClip`.
 * `openingsExceedWalls` tells the tool to raise a warning instead of returning a negative area.
 */
export function wallAreaM2(
  room: Room,
  clip: OpeningClip = "none",
): {
  areaM2: number;
  grossM2: number;
  openingsM2: number;
  openingsExceedWalls: boolean;
} {
  const grossM2 = grossWallAreaM2(room);
  const openingsM2 =
    clip === "none" ? openingsAreaM2(room.openings) : clippedOpeningsAreaM2(room.openings, room.heightMm, clip);
  return {
    areaM2: Math.max(grossM2 - openingsM2, 0),
    grossM2,
    openingsM2,
    openingsExceedWalls: openingsM2 > grossM2,
  };
}
