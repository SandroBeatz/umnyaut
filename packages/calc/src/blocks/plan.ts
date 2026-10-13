import * as z from "zod/mini";
import type { CutCorner, ElevationOpening, Layout, LayoutMark, Opening, PlanWall, Step } from "../types";

/**
 * Room plan (docs/ui/room-plan-and-layout-guides.md). Plan frame: x along the room length to the right, y along
 * the width down, mm. Walls are numbered clockwise from the top-left corner (the UI shows them 1-based); an
 * opening's offset runs clockwise along its wall from the wall's first corner to the opening's near edge.
 */

/**
 * Window sill height when a placed window has none: a usual 80–90 cm in flats — practice, not a norm; the user
 * sets the real one in the plan editor.
 */
export const WINDOW_SILL_MM = 900;

/** Places of one opening on the plan (see `OpeningPlace`). */
export const openingPlacesSchema = z.readonly(
  z
    .array(
      z.object({
        wall: z.int().check(z.minimum(0), z.maximum(11)),
        offsetMm: z.int().check(z.minimum(0), z.maximum(100_000)),
        sillMm: z.optional(z.int().check(z.minimum(0), z.maximum(10_000))),
        bareBelow: z.optional(z.boolean()),
      }),
    )
    .check(z.maxLength(50)),
);

/** One opening input schema for every tool, so placements survive when the room moves between tools. */
export const openingInputSchema = z.object({
  type: z.enum(["door", "window"]),
  widthMm: z.int().check(z.minimum(100), z.maximum(10_000)),
  heightMm: z.int().check(z.minimum(100), z.maximum(10_000)),
  count: z.int().check(z.minimum(0), z.maximum(50)),
  places: z.optional(openingPlacesSchema),
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
  /** From the wall's first corner, pulled back to fit the wall. */
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  sillMm?: number;
  bareBelow?: boolean;
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
        offsetMm: from,
        widthMm: o.widthMm,
        heightMm: o.heightMm,
        ...(place.sillMm === undefined ? {} : { sillMm: place.sillMm }),
        ...(place.bareBelow ? { bareBelow: true } : {}),
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

export interface StartInput {
  lengthMm: number;
  widthMm: number;
  /** Rows or sheets run along the room length (x) or its width (y). */
  alongLength: boolean;
  /** The canonical layout (start at the top-left) mirrored on the plan. */
  flipX: boolean;
  flipY: boolean;
  walls: readonly PlanWall[];
}

/**
 * The «Старт» mark: from the start corner along the rows or sheets, and the start wall — the one running that
 * way through the corner.
 */
export function startOf(i: StartInput): { start: LayoutMark; startWall: number } {
  const span = i.alongLength ? i.lengthMm : i.widthMm;
  const cornerX = i.flipX ? i.lengthMm : 0;
  const cornerY = i.flipY ? i.widthMm : 0;
  const reach = Math.min(span / 3, 1000);
  const dirX = i.alongLength ? (i.flipX ? -1 : 1) : 0;
  const dirY = i.alongLength ? 0 : i.flipY ? -1 : 1;
  const start: LayoutMark = {
    kind: "start",
    x1: cornerX,
    y1: cornerY,
    x2: cornerX + dirX * reach,
    y2: cornerY + dirY * reach,
  };
  const side = i.alongLength ? (i.flipY ? "bottom" : "top") : i.flipX ? "right" : "left";
  const on = (w: PlanWall) => (w.x1 === cornerX && w.y1 === cornerY) || (w.x2 === cornerX && w.y2 === cornerY);
  const startWall = Math.max(
    i.walls.findIndex((w) => w.side === side && on(w)),
    0,
  );
  return { start, startWall };
}

/**
 * Which way the light from the windows runs: across a window wall, weighted by window width. Light through a
 * left or right wall runs along the room length. Undecided with no windows or a tie.
 */
export function lightDirection(
  walls: readonly PlanWall[],
  windows: readonly { wall: number; widthMm: number }[],
): "length" | "width" | undefined {
  let along = 0;
  for (const w of windows) {
    const side = walls[w.wall]?.side;
    along += side === "left" || side === "right" ? w.widthMm : -w.widthMm;
  }
  return along > 0 ? "length" : along < 0 ? "width" : undefined;
}

/**
 * Placed doors and windows on one wall, unfolded (x from the wall's first corner, y down from the ceiling): a
 * door stands on the floor, a window on its sill (`WINDOW_SILL_MM` when not set); one that would pass the
 * ceiling is held under it (`aboveCeiling` counts those windows); a window with `bareBelow` adds a bare zone from
 * its sill to the floor. `defaultSill` — a window here has no sill of its
 * own.
 */
export function wallOpenings(placed: readonly PlacedOpening[], wall: number, heightMm: number) {
  let defaultSill = false;
  /** Windows whose sill + height passes the ceiling: held under it (a warning in the tool). */
  let aboveCeiling = 0;
  const openings = placed
    .filter((p) => p.wall === wall)
    .flatMap((p): ElevationOpening[] => {
      const h = Math.min(p.heightMm, heightMm);
      if (p.type === "door") return [{ type: "door", x: p.offsetMm, y: heightMm - h, w: p.widthMm, h }];
      if (p.sillMm === undefined) defaultSill = true;
      if ((p.sillMm ?? WINDOW_SILL_MM) + h > heightMm) aboveCeiling++;
      const sill = Math.min(p.sillMm ?? WINDOW_SILL_MM, heightMm - h);
      const window: ElevationOpening = { type: "window", x: p.offsetMm, y: heightMm - sill - h, w: p.widthMm, h };
      // Left bare under the window: a zone from the sill down to the floor, as wide as the window.
      return p.bareBelow && sill > 0
        ? [window, { type: "bare", x: p.offsetMm, y: heightMm - sill, w: p.widthMm, h: sill }]
        : [window];
    });
  return { openings, defaultSill, aboveCeiling };
}

/**
 * The room plan alone (room area, wall area): outline, walls and the placed doors and windows, no pieces. The
 * guide asks to add or place openings while the plan has none or not all of them; `off` is for the
 * `opening_off_wall` warning.
 */
export function planLayout(outline: Outline, openings: readonly Opening[]): { layout: Layout; off: number } {
  const { placed, off } = placeOpenings(outline.walls, openings);
  const total = openings.reduce((n, o) => n + o.count, 0);
  const guide: Step[] =
    total === 0
      ? [{ code: "add_openings", values: {} }]
      : placed.length < total
        ? [{ code: "place_openings", values: { count: total - placed.length } }]
        : [];
  const xs = outline.points.map(([x]) => x);
  const ys = outline.points.map(([, y]) => y);
  return {
    layout: {
      kind: "plan",
      widthMm: Math.max(...xs),
      heightMm: Math.max(...ys),
      outline: outline.points,
      walls: outline.walls,
      pieces: [],
      marks: placed.map((p) => p.mark),
      guide,
      stats: { whole: 0, cut: 0, reused: 0, wasteM2: 0 },
    },
    off,
  };
}
