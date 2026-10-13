import * as z from "zod/mini";
import {
  cornerFlips,
  cutCornerSchema,
  gridArea,
  gridLayout,
  mm2ToM2,
  mmToM,
  openingInputSchema,
  placeOpenings,
  purchase,
  roomOutline,
  WINDOW_SILL_MM,
  wallAreaM2,
  wallGrid,
  wallOpenings,
} from "../../blocks";
import type {
  Layout,
  LayoutElevation,
  LayoutMark,
  PlanWall,
  PurchaseItem,
  Room,
  Step,
  ToolModule,
  ToolResult,
  Warning,
} from "../../types";
import { klej } from "../klej";
import { zatirka } from "../zatirka";

const length = z.int().check(z.minimum(300), z.maximum(100_000));

/** Shared with every tool, so the plan places of openings survive between tools. */
const opening = openingInputSchema;

const input = z.object({
  /** `both` — «Пол и стены» with one tile: the floor and the walls counted each as alone, summed (P17.5). */
  surface: z.enum(["floor", "walls", "both"]),
  shape: z.enum(["rect", "l"]),
  lengthMm: length,
  widthMm: length,
  /** Corner cut-out of an L-shaped floor (from “My room”). */
  cutLengthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutWidthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  /** Where the cut-out sits on the plan (floor scheme only). */
  cutCorner: cutCornerSchema,
  heightMm: z.int().check(z.minimum(1000), z.maximum(10_000)),
  openings: z.readonly(z.array(opening).check(z.maxLength(20))),
  /** Along the room length on the floor, horizontal on walls. */
  tileLengthMm: z.int().check(z.minimum(20), z.maximum(3000)),
  /** Across on the floor, vertical on walls. */
  tileWidthMm: z.int().check(z.minimum(20), z.maximum(3000)),
  jointMm: z.number().check(z.minimum(0), z.maximum(20)),
  layout: z.enum(["straight", "diagonal"]),
  start: z.enum(["corner", "center"]),
  /** Norm `tile.reserve` (straight), `tile.reserve.diagonal` replaces it for the diagonal. */
  reservePct: z.number().check(z.minimum(0), z.maximum(30)),
  tilesPerBox: z.int().check(z.minimum(1), z.maximum(200)),
  /** Related: tile adhesive and grout, counted by the adhesive and grout tools with this tile and joint. */
  adhesive: z.boolean(),
  grout: z.boolean(),
  /** Product variants of the related adhesive and grout (see those tools). */
  adhesiveClass: z.enum(["C1", "C1T", "C2TE", "C2TE-S1", "C2-S2"]),
  groutColor: z.enum(["white", "light-grey", "grey", "graphite", "anthracite", "beige", "brown", "black", "custom"]),
  groutColorName: z.string().check(z.maxLength(30)),
  /** Primer under the tile, one coat over the tiled area (norm `primer.consumption`), as in wallpaper and paint. */
  primer: z.boolean(),
  primerRateLPerM2: z.number().check(z.minimum(0.05), z.maximum(1)),
  primerPackL: z.number().check(z.minimum(0.5), z.maximum(50)),
  /** Grout depth = tile thickness. */
  tileThicknessMm: z.number().check(z.minimum(3), z.maximum(30)),
});

export type PlitkaInput = z.infer<typeof input>;

/** Norm `tile.reserve.diagonal` (Kerama Marazzi). */
export const TILE_DIAGONAL_RESERVE_PCT = 15;

/** The wall on `side` lying at the room's edge (x or y = `at`): where a column or row of the grid ends. */
const edgeWall = (walls: readonly PlanWall[], side: PlanWall["side"], at: number) =>
  walls.findIndex((w) => w.side === side && (side === "left" || side === "right" ? w.x1 === at : w.y1 === at));

/**
 * Floor scheme, straight laying: the grid the tiles were counted on. From a corner the whole tiles lie at the
 * start walls and the cut at the opposite ones, so the start corner goes to a placed door (the entrance is seen
 * first); from the centre the cuts are equal at opposite walls.
 */
function floorScheme(i: PlitkaInput, real: boolean, warnings: Warning[]): Layout {
  const cut = real ? { lengthMm: i.cutLengthMm, widthMm: i.cutWidthMm } : undefined;
  const outline = roomOutline(i.lengthMm, i.widthMm, cut, i.cutCorner);
  const { placed, off } = placeOpenings(outline.walls, i.openings);
  if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });
  const corner = i.start === "corner";
  // Only a door in an outer wall: the grid starts at the room's outer corners, so whole tiles can lie there
  // and not at a door in the cut-out's walls.
  const outer = (w: PlanWall | undefined) =>
    w !== undefined &&
    (w.side === "left"
      ? w.x1 === 0
      : w.side === "right"
        ? w.x1 === i.lengthMm
        : w.side === "top"
          ? w.y1 === 0
          : w.y1 === i.widthMm);
  const doors = placed.filter((p) => p.type === "door");
  const door = doors.find((p) => outer(outline.walls[p.wall]));
  const doorSide = door ? outline.walls[door.wall]?.side : undefined;
  let flipX = corner && doorSide === "right";
  let flipY = corner && doorSide === "bottom";
  let cutOut: { x: number; y: number; w: number; h: number } | undefined;
  if (cut) {
    const f = cornerFlips(i.cutCorner);
    cutOut = {
      x: f.x ? 0 : i.lengthMm - cut.lengthMm,
      y: f.y ? 0 : i.widthMm - cut.widthMm,
      w: cut.lengthMm,
      h: cut.widthMm,
    };
    // The start corner must be a corner of the room, not of the missing cut-out: move it along the door's wall.
    if (corner && f.x !== flipX && f.y !== flipY) {
      if (doorSide === "left" || doorSide === "right") flipY = !flipY;
      else flipX = !flipX;
    }
  }
  const grid = gridLayout({
    lengthMm: i.lengthMm,
    widthMm: i.widthMm,
    tileLengthMm: i.tileLengthMm,
    tileWidthMm: i.tileWidthMm,
    jointMm: i.jointMm,
    start: i.start,
    flipX,
    flipY,
    cutOut,
  });

  const walls = outline.walls;
  const left = edgeWall(walls, "left", 0) + 1;
  const right = edgeWall(walls, "right", i.lengthMm) + 1;
  const top = edgeWall(walls, "top", 0) + 1;
  const bottom = edgeWall(walls, "bottom", i.widthMm) + 1;
  const cutX = grid.columns.filter((c) => c.cut).map((c) => c.size);
  const cutY = grid.rows.filter((r) => r.cut).map((r) => r.size);
  const cm = (mm: number) => Math.round(mm) / 10;
  const marks: LayoutMark[] = placed.map((p) => p.mark);
  const guide: Step[] = [];
  if (corner) {
    const x = flipX ? i.lengthMm : 0;
    const y = flipY ? i.widthMm : 0;
    const reach = Math.min(i.lengthMm / 3, 1000);
    marks.unshift({ kind: "start", x1: x, y1: y, x2: x + (flipX ? -reach : reach), y2: y });
    guide.push({ code: "start_corner", values: { a: flipY ? bottom : top, b: flipX ? right : left } });
    if (door) guide.push({ code: "start_door", values: {} });
    // One cut per axis, at the far wall.
    if (cutX.length > 0)
      guide.push({ code: "cut_wall", values: { wall: flipX ? left : right, cut: cm(cutX[0] ?? 0) } });
    if (cutY.length > 0)
      guide.push({ code: "cut_wall", values: { wall: flipY ? top : bottom, cut: cm(cutY[0] ?? 0) } });
    // A cut under a quarter of the tile side it is cut from.
    if ((cutX[0] ?? i.tileLengthMm) < i.tileLengthMm / 4 || (cutY[0] ?? i.tileWidthMm) < i.tileWidthMm / 4)
      guide.push({ code: "try_center", values: {} });
  } else {
    // The two axes through the middle of the room, drawn like seams.
    marks.unshift(
      { kind: "seam", x1: i.lengthMm / 2, y1: 0, x2: i.lengthMm / 2, y2: i.widthMm },
      { kind: "seam", x1: 0, y1: i.widthMm / 2, x2: i.lengthMm, y2: i.widthMm / 2 },
    );
    guide.push({ code: "start_center", values: {} });
    if (cutX.length > 0) guide.push({ code: "cut_walls", values: { a: left, b: right, cut: cm(cutX[0] ?? 0) } });
    if (cutY.length > 0) guide.push({ code: "cut_walls", values: { a: top, b: bottom, cut: cm(cutY[0] ?? 0) } });
  }
  if (cutX.length === 0 && cutY.length === 0) guide.push({ code: "no_cuts", values: {} });
  if (cutOut) guide.push({ code: "cut_out", values: {} });
  if (i.jointMm > 0) guide.push({ code: "joint", values: { joint: i.jointMm } });
  if (corner && doors.length === 0) guide.push({ code: "place_door", values: {} });

  const cutCount = grid.pieces.filter((p) => p.cut).length;
  return {
    kind: "grid",
    widthMm: i.lengthMm,
    heightMm: i.widthMm,
    outline: outline.points,
    walls,
    pieces: grid.pieces,
    marks,
    guide,
    stats: { whole: grid.pieces.length - cutCount, cut: cutCount, reused: 0, wasteM2: 0 },
  };
}

/** Wall tiling scheme and, once every counted door and window is placed, the exact count it lays. */
interface WallsScheme {
  layout: Layout;
  /** All openings placed: whole and cut tiles of the scheme are the purchase. */
  exact?: { whole: number; cut: number; dropped: number; around: number };
  narrowestMm: number;
}

/**
 * Walls unfolded one by one, seen from the room: columns from each wall's left corner, rows from the floor. With
 * every opening placed, a tile wholly inside a door or a window is not laid and one over its edge is cut — the
 * count follows the scheme. With an opening not placed the walls are drawn empty and the guide asks to place it.
 */
function wallsScheme(
  i: PlitkaInput,
  openings: readonly PlitkaInput["openings"][number][],
  warnings: Warning[],
): WallsScheme {
  const H = i.heightMm;
  const outline = roomOutline(i.lengthMm, i.widthMm);
  const { placed, off } = placeOpenings(outline.walls, openings);
  if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });
  const total = openings.reduce((n, o) => n + o.count, 0);
  const all = placed.length === total;
  const elevations: LayoutElevation[] = [];
  let whole = 0;
  let cut = 0;
  let dropped = 0;
  let around = 0;
  let narrowest = Number.POSITIVE_INFINITY;
  let defaultSill = false;
  let aboveCeiling = 0;
  outline.walls.forEach((wall, k) => {
    const { openings: withBare, defaultSill: noSill, aboveCeiling: high } = wallOpenings(placed, k, H);
    // «Под окном не клеим» is a wallpaper choice: tiles keep the wall under a window.
    const on = withBare.filter((o) => o.type !== "bare");
    if (noSill) defaultSill = true;
    aboveCeiling += high;
    const grid = wallGrid({
      lengthMm: wall.lengthMm,
      heightMm: H,
      tileLengthMm: i.tileLengthMm,
      tileWidthMm: i.tileWidthMm,
      jointMm: i.jointMm,
      start: i.start,
      openings: on,
    });
    const cutHere = grid.pieces.filter((p) => p.cut).length;
    whole += grid.pieces.length - cutHere;
    cut += cutHere;
    dropped += grid.dropped;
    around += grid.aroundOpenings;
    narrowest = Math.min(narrowest, ...grid.cutColumns, ...grid.cutRows);
    elevations.push({
      wall: k,
      lengthMm: wall.lengthMm,
      heightMm: H,
      pieces: all ? grid.pieces : [],
      openings: on,
      cutColumns: grid.cutColumns,
      cutRows: grid.cutRows,
      aroundOpenings: all ? grid.aroundOpenings : 0,
    });
  });

  if (aboveCeiling > 0)
    warnings.push({ code: "window_above_ceiling", level: "warning", values: { count: aboveCeiling } });
  const cm = (mm: number) => Math.round(mm) / 10;
  const guide: Step[] = [];
  const rows = elevations[0]?.cutRows ?? [];
  if (i.start === "corner") {
    guide.push({ code: "walls_corner", values: {} });
    if (rows.length > 0) guide.push({ code: "walls_cut_top", values: { cut: cm(rows[0] ?? 0) } });
  } else {
    guide.push({ code: "walls_center", values: {} });
    if (rows.length > 0) guide.push({ code: "walls_cut_rows", values: { cut: cm(rows[0] ?? 0) } });
  }
  guide.push({ code: "walls_batten", values: {} });
  if (all && around > 0) guide.push({ code: "walls_openings", values: { tiles: around } });
  if (all && defaultSill) guide.push({ code: "walls_sill", values: { sill: WINDOW_SILL_MM / 10 } });
  if (i.start === "corner") {
    const quarter = elevations.some(
      (e) =>
        (e.cutColumns ?? []).some((c) => c < i.tileLengthMm / 4) ||
        (e.cutRows ?? []).some((c) => c < i.tileWidthMm / 4),
    );
    if (quarter) guide.push({ code: "try_center", values: {} });
  }
  if (i.jointMm > 0) guide.push({ code: "joint", values: { joint: i.jointMm } });
  if (!all) guide.push({ code: "place_openings", values: {} });

  return {
    layout: {
      kind: "grid",
      widthMm: i.lengthMm,
      heightMm: i.widthMm,
      outline: outline.points,
      walls: outline.walls,
      pieces: [],
      marks: placed.map((p) => p.mark),
      elevations,
      guide,
      stats: all ? { whole, cut, reused: 0, wasteM2: 0 } : { whole: 0, cut: 0, reused: 0, wasteM2: 0 },
    },
    ...(all ? { exact: { whole, cut, dropped, around } } : {}),
    narrowestMm: narrowest,
  };
}

/**
 * Tile by piece count (Kerama Marazzi): a grid from a corner or from the centre over the floor or each wall;
 * every cut piece takes a tile; whole tiles inside doors and windows are left out (cut tiles around them are
 * kept — safe side). Tiles × (1 + reserve), rounded up to whole tiles; boxes via `ceilPacks`. Diagonal: area /
 * tile area × 1,15. Rectangular room. Adhesive, grout and primer over the same area come along.
 */
export const plitka: ToolModule<PlitkaInput> = {
  id: "plitka",
  // 2: from a corner, a rest no wider than a joint is a gap at the wall, not a cut tile.
  // 3: walls with every door and window placed are counted tile by tile around them.
  // 4: primer under the tile, one coat over the tiled area (Ceresit CT 17: 0,1–0,2 л/м², norm 0,15).
  // 5: «Пол и стены» with one tile: floor and walls counted each as alone, one reserve and one box count.
  version: 5,
  input,
  defaults: () => ({
    surface: "floor",
    shape: "rect",
    lengthMm: 4600,
    widthMm: 4300,
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    cutCorner: "se",
    heightMm: 2700,
    // The example plan of every floor tool: door in the bottom wall, window in the left one.
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 3, offsetMm: 1550 }] },
    ],
    tileLengthMm: 300,
    tileWidthMm: 300,
    jointMm: 3,
    layout: "straight",
    start: "corner",
    reservePct: 10,
    tilesPerBox: 12,
    adhesive: true,
    grout: true,
    adhesiveClass: "C1T",
    groutColor: "white",
    groutColorName: "",
    primer: true,
    primerRateLPerM2: 0.15,
    primerPackL: 10,
    tileThicknessMm: 8,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const steps: Step[] = [];
    const tileM2 = mm2ToM2(i.tileLengthMm * i.tileWidthMm);
    const pitchX = i.tileLengthMm + i.jointMm;
    const pitchY = i.tileWidthMm + i.jointMm;
    let whole = 0;
    let cut = 0;
    let narrowest = Number.POSITIVE_INFINITY;
    let areaM2 = 0;
    let layout: Layout | undefined;
    const both = i.surface === "both";

    let floorM2 = 0;
    if (i.surface !== "walls") {
      const l = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
      const real = l && i.cutLengthMm < i.lengthMm && i.cutWidthMm < i.widthMm;
      if (l && !real) warnings.push({ code: "cut_too_large", level: "warning" });
      floorM2 = mm2ToM2(i.lengthMm * i.widthMm - (real ? i.cutLengthMm * i.cutWidthMm : 0));
      areaM2 += floorM2;
      if (i.layout === "straight") {
        const g = gridArea(i.lengthMm, i.widthMm, i.tileLengthMm, i.tileWidthMm, i.jointMm, i.start);
        whole += g.whole;
        cut += g.cut;
        if (g.cut > 0) narrowest = g.narrowestMm;
        if (real) {
          // Whole tiles surely inside the cut-out are not needed; tiles along its inner edges stay (now cut).
          const inside =
            Math.max(Math.floor((i.cutLengthMm - i.tileLengthMm) / pitchX), 0) *
            Math.max(Math.floor((i.cutWidthMm - i.tileWidthMm) / pitchY), 0);
          whole = Math.max(whole - inside, 0);
          steps.push({ code: "cut_out", values: { tiles: inside } });
        }
        layout = floorScheme(i, real, warnings);
      }
    }
    if (i.surface !== "floor") {
      const openings = i.openings.filter((o) => o.count > 0);
      const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
      const walls = wallAreaM2(room);
      if (walls.openingsExceedWalls || !(walls.areaM2 > 0)) {
        warnings.push({ code: "openings_exceed_walls", level: "warning" });
        // «Пол и стены» keeps the floor; walls alone have nothing to tile.
        if (!both) return { items: [], summary: [], warnings, steps };
      } else {
        areaM2 += walls.areaM2;
        if (both) {
          steps.push({ code: "both", values: { floor: floorM2, walls: walls.areaM2, area: areaM2 } });
        }
        if (i.layout === "straight") {
          let wallsWhole = 0;
          let wallsCut = 0;
          const scheme = wallsScheme(i, openings, warnings);
          // Floor and walls on one scheme card: the floor plan, then the walls unfolded (the floor's guide first).
          layout =
            both && layout
              ? {
                  ...layout,
                  elevations: scheme.layout.elevations ?? [],
                  // Advice both schemes give (the joint, «try from the centre») once.
                  guide: [...(layout.guide ?? []), ...(scheme.layout.guide ?? [])].filter(
                    (step, k, all) => all.findIndex((o) => o.code === step.code) === k,
                  ),
                  stats: {
                    whole: layout.stats.whole + scheme.layout.stats.whole,
                    cut: layout.stats.cut + scheme.layout.stats.cut,
                    reused: 0,
                    wasteM2: 0,
                  },
                }
              : scheme.layout;
          if (scheme.exact) {
            // Every door and window is placed: the tiles are the scheme's, wall by wall.
            wallsWhole = scheme.exact.whole;
            wallsCut = scheme.exact.cut;
            if (Number.isFinite(scheme.narrowestMm)) narrowest = Math.min(narrowest, scheme.narrowestMm);
            steps.push({
              code: "openings_placed",
              values: { tiles: scheme.exact.dropped, around: scheme.exact.around },
            });
          } else {
            for (const wall of [i.lengthMm, i.widthMm, i.lengthMm, i.widthMm]) {
              const g = gridArea(wall, i.heightMm, i.tileLengthMm, i.tileWidthMm, i.jointMm, i.start);
              wallsWhole += g.whole;
              wallsCut += g.cut;
              if (g.cut > 0) narrowest = Math.min(narrowest, g.narrowestMm);
            }
            // Whole tiles surely inside an opening wherever it sits: ⌊(size − tile) / pitch⌋ per side. A door
            // stands on the floor, so from a corner its height lines up with the rows: ⌊(h + joint) / pitch⌋.
            const inside = (size: number, tileMm: number, pitch: number) =>
              Math.max(Math.floor((size - tileMm) / pitch), 0);
            const covered = openings.reduce((n, o) => {
              const h = Math.min(o.heightMm, i.heightMm);
              const across = inside(o.widthMm, i.tileLengthMm, pitchX);
              const up =
                o.type === "door" && i.start === "corner"
                  ? Math.floor((h + i.jointMm) / pitchY)
                  : inside(h, i.tileWidthMm, pitchY);
              return n + across * up * o.count;
            }, 0);
            wallsWhole = Math.max(wallsWhole - covered, 0);
            steps.push({ code: "openings", values: { tiles: covered } });
          }
          whole += wallsWhole;
          cut += wallsCut;
        }
      }
    }
    if (!(areaM2 > 0)) return { items: [], summary: [], warnings, steps };

    let tiles: number;
    if (i.layout === "diagonal") {
      tiles = Math.ceil((areaM2 / tileM2) * (1 + TILE_DIAGONAL_RESERVE_PCT / 100) - 1e-9);
      steps.push({ code: "diagonal", values: { area: areaM2, tile: tileM2, pct: TILE_DIAGONAL_RESERVE_PCT, tiles } });
    } else {
      tiles = Math.ceil((whole + cut) * (1 + i.reservePct / 100) - 1e-9);
      steps.push(
        { code: "grid", values: { whole, cut, pieces: whole + cut } },
        { code: "reserve", values: { pieces: whole + cut, pct: i.reservePct, tiles } },
      );
      const shortSide = Math.min(i.tileLengthMm, i.tileWidthMm);
      if (Number.isFinite(narrowest) && narrowest < shortSide / 4) {
        warnings.push({ code: "narrow_cut", level: "info", values: { cut: narrowest / 10 } });
      }
    }
    if (tiles <= 0) return { items: [], summary: [], warnings, steps };

    const tile = purchase(
      "tile",
      "main",
      { value: tiles, unit: "pcs" },
      {
        kind: "box",
        size: { value: i.tilesPerBox, unit: "pcs" },
      },
    );
    steps.push({ code: "boxes", values: { tiles, perBox: i.tilesPerBox, boxes: tile.packs } });

    // Adhesive and grout for the same surface, tile and joint — the very formulas of those two tools.
    const related: PurchaseItem[] = [];
    const surface = {
      surface: i.surface,
      shape: i.shape,
      cutLengthMm: i.cutLengthMm,
      cutWidthMm: i.cutWidthMm,
      lengthMm: i.lengthMm,
      widthMm: i.widthMm,
      heightMm: i.heightMm,
      openings: i.openings,
      tileLengthMm: i.tileLengthMm,
      tileWidthMm: i.tileWidthMm,
    };
    if (i.adhesive) {
      const glue = klej.compute(
        { ...klej.defaults({ country: "RU" }), ...surface, adhesiveClass: i.adhesiveClass },
        { country: "RU" },
      );
      related.push(...glue.items.map((it) => ({ ...it, role: "related" as const })));
      const kg = glue.items.reduce((n, it) => n + it.need.value, 0);
      steps.push({ code: "adhesive", values: { kg, bags: glue.items.reduce((n, it) => n + it.packs, 0) } });
    }
    if (i.grout && i.jointMm > 0) {
      const fill = zatirka.compute(
        {
          ...zatirka.defaults({ country: "RU" }),
          ...surface,
          jointMm: i.jointMm,
          depthMm: i.tileThicknessMm,
          groutColor: i.groutColor,
          groutColorName: i.groutColorName,
        },
        { country: "RU" },
      );
      related.push(...fill.items.map((it) => ({ ...it, role: "related" as const })));
      const kg = fill.items.reduce((n, it) => n + it.need.value, 0);
      steps.push({ code: "grout", values: { kg, packs: fill.items.reduce((n, it) => n + it.packs, 0) } });
    }

    if (i.primer) {
      const litres = areaM2 * i.primerRateLPerM2;
      const primer = purchase(
        "primer",
        "related",
        { value: litres, unit: "l" },
        { kind: "canister", size: { value: i.primerPackL, unit: "l" } },
      );
      related.push(primer);
      if (primer.leftover.value > 4 * litres) {
        warnings.push({ code: "primer_small_need", level: "info", values: { need: litres, size: i.primerPackL } });
      }
      steps.push({
        code: "primer",
        values: { area: areaM2, rate: i.primerRateLPerM2, litres, packs: primer.packs, size: i.primerPackL },
      });
    }

    return {
      items: [tile, ...related],
      summary: [
        { key: "tiles", value: tiles, unit: "pcs" },
        ...(i.layout === "straight"
          ? [
              { key: "whole", value: whole, unit: "pcs" as const },
              { key: "cut", value: cut, unit: "pcs" as const },
            ]
          : []),
        { key: "area", value: areaM2, unit: "m2" },
        { key: "tileArea", value: mmToM(i.tileLengthMm) * mmToM(i.tileWidthMm), unit: "m2" },
      ],
      // «Пол и стены» places the openings on both schemes: one warning of a kind is enough.
      warnings: warnings.filter((w, k) => warnings.findIndex((o) => o.code === w.code) === k),
      steps,
      ...(layout ? { layout } : {}),
    };
  },
};
