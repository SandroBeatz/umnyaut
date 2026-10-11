import { z } from "zod";
import type { CutCorner, LayoutMark, Opening, PlanWall } from "../types";

/**
 * Room plan (docs/ui/room-plan-and-layout-guides.md). Plan frame: x along the room length to the right, y along
 * the width down, mm. Walls are numbered clockwise from the top-left corner (the UI shows them 1-based); an
 * opening's offset runs clockwise along its wall from the wall's first corner to the opening's near edge.
 */

/** Places of one opening on the plan (see `OpeningPlace`). */
export const openingPlacesSchema = z
  .array(z.object({ wall: z.number().int().min(0).max(11), offsetMm: z.number().int().min(0).max(100_000) }))
  .max(50)
  .readonly();

/** One opening input schema for every tool, so placements survive when the room moves between tools. */
export const openingInputSchema = z.object({
  type: z.enum(["door", "window"]),
  widthMm: z.number().int().min(100).max(10_000),
  heightMm: z.number().int().min(100).max(10_000),
  count: z.number().int().min(0).max(50),
  places: openingPlacesSchema.optional(),
});

export const cutCornerSchema = z.enum(["ne", "se", "sw", "nw"]);

export type Point = readonly [number, number];

export interface Outline {
  points: Point[];
  walls: PlanWall[];
}

/** The flips that move the canonical cut-out (bottom right, `se`) to the given corner. */
export function cornerFlips(corner: CutCorner): { x: boolean; y: boolean } {
  return { x: corner === "sw" || corner === "nw", y: corner === "ne" || corner === "nw" };
}

const sideOf = (dx: number, dy: number): PlanWall["side"] =>
  dx > 0 ? "top" : dx < 0 ? "bottom" : dy > 0 ? "right" : "left";

/**
 * Room contour clockwise from the top-left corner and its walls. `cut` is the L-shape's cut-out (along the
 * length, along the width) in `corner`; a cut-out that is not smaller than the room both ways is ignored.
 */
export function roomOutline(
  lengthMm: number,
  widthMm: number,
  cut?: { lengthMm: number; widthMm: number },
  corner: CutCorner = "se",
): Outline {
  const L = lengthMm;
  const W = widthMm;
  const real = cut && cut.lengthMm > 0 && cut.widthMm > 0 && cut.lengthMm < L && cut.widthMm < W;
  let points: Point[] = real
    ? [
        [0, 0],
        [L, 0],
        [L, W - cut.widthMm],
        [L - cut.lengthMm, W - cut.widthMm],
        [L - cut.lengthMm, W],
        [0, W],
      ]
    : [
        [0, 0],
        [L, 0],
        [L, W],
        [0, W],
      ];
  if (real) {
    const flip = cornerFlips(corner);
    if (flip.x || flip.y) {
      points = points.map(([x, y]) => [flip.x ? L - x : x, flip.y ? W - y : y] as const);
      // One flip turns the contour anticlockwise; two keep it clockwise.
      if (flip.x !== flip.y) points.reverse();
      const first = points.reduce((b, p, i) => {
        const q = points[b] as Point;
        return p[1] < q[1] || (p[1] === q[1] && p[0] < q[0]) ? i : b;
      }, 0);
      points = [...points.slice(first), ...points.slice(0, first)];
    }
  }
  const walls = points.map(([x1, y1], i): PlanWall => {
    const [x2, y2] = points[(i + 1) % points.length] as Point;
    return { x1, y1, x2, y2, lengthMm: Math.abs(x2 - x1) + Math.abs(y2 - y1), side: sideOf(x2 - x1, y2 - y1) };
  });
  return { points, walls };
}

export interface PlacedOpening {
  type: Opening["type"];
  wall: number;
  widthMm: number;
  mark: LayoutMark;
}

/**
 * Placed openings on the plan. Places past `count` are ignored; an opening longer than what is left of its wall
 * is pulled back to fit, and one on a wall that does not exist is skipped (`off` counts both for a warning).
 */
export function placeOpenings(walls: readonly PlanWall[], openings: readonly Opening[]) {
  const placed: PlacedOpening[] = [];
  let off = 0;
  for (const o of openings) {
    for (const place of (o.places ?? []).slice(0, o.count)) {
      const wall = walls[place.wall];
      if (!wall || o.widthMm > wall.lengthMm) {
        off++;
        continue;
      }
      if (place.offsetMm + o.widthMm > wall.lengthMm) off++;
      const from = Math.min(place.offsetMm, wall.lengthMm - o.widthMm);
      const dx = Math.sign(wall.x2 - wall.x1);
      const dy = Math.sign(wall.y2 - wall.y1);
      placed.push({
        type: o.type,
        wall: place.wall,
        widthMm: o.widthMm,
        mark: {
          kind: o.type,
          wall: place.wall,
          x1: wall.x1 + dx * from,
          y1: wall.y1 + dy * from,
          x2: wall.x1 + dx * (from + o.widthMm),
          y2: wall.y1 + dy * (from + o.widthMm),
        },
      });
    }
  }
  return { placed, off };
}
