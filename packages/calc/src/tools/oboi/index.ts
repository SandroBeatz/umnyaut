import * as z from "zod/mini";
import {
  BLOCK_GAP_MM,
  type CutPlan,
  cutCornerSchema,
  cutStrips,
  type HangBlank,
  type HangResult,
  hangStrips,
  mm2ToM2,
  mmToM,
  openingInputSchema,
  placeOpenings,
  planCuts,
  purchase,
  roomOutline,
  WINDOW_SILL_MM,
  wallAreaM2,
  wallOpenings,
} from "../../blocks";
import type {
  ElevationOpening,
  Layout,
  LayoutElevation,
  LayoutMark,
  LayoutPiece,
  LayoutRoll,
  PlanWall,
  PurchaseItem,
  Room,
  Step,
  ToolModule,
  ToolResult,
  Warning,
} from "../../types";
import { patternFromRepeat } from "../pattern";

const length = z.int().check(z.minimum(300), z.maximum(100_000));

/** Shared with every tool, so the plan places of openings survive between tools. */
const opening = openingInputSchema;

/** A part of a wall the user leaves without wallpaper (behind furniture, at an air conditioner): set explicitly. */
const zone = z.object({
  /** 0-based wall index along the outline. */
  wall: z.int().check(z.minimum(0), z.maximum(11)),
  /** From the wall's first corner (seen from the room, the left one) to the zone, mm. */
  offsetMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  fromFloorMm: z.int().check(z.minimum(0), z.maximum(10_000)),
  widthMm: z.int().check(z.minimum(10), z.maximum(100_000)),
  heightMm: z.int().check(z.minimum(10), z.maximum(10_000)),
});

const input = z.object({
  lengthMm: length,
  widthMm: length,
  /** L-shaped room from “My room”: the walls follow its outline (an outer corner gets its own wrap). */
  shape: z.enum(["rect", "l"]),
  cutLengthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutWidthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutCorner: cutCornerSchema,
  heightMm: z.int().check(z.minimum(1000), z.maximum(10_000)),
  openings: z.readonly(z.array(opening).check(z.maxLength(20))),
  /** Bare zones (wallpaper not hung there). */
  zones: z.readonly(z.array(zone).check(z.maxLength(20))),
  /** Where to start: chosen by the calculator, or a wall and a level line set by the user. */
  startMode: z.enum(["auto", "manual"]),
  startWall: z.int().check(z.minimum(1), z.maximum(12)),
  /** The first level line, mm from the start wall's left corner (manual start). */
  startLineMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  /** Large pattern: a strip or a joint in the middle of the main wall. */
  symmetric: z.boolean(),
  /**
   * At doors and windows: `whole` — a strip hung whole over the edge and trimmed on the wall (manufacturers' way);
   * `edge` — cut lengthwise at the edge, pieces above and below (fewer strips, joints at the corners of openings).
   */
  aroundOpenings: z.enum(["whole", "edge"]),
  /** The wall seen first (1-based); 0 — the one opposite the door. */
  mainWall: z.int().check(z.minimum(0), z.maximum(12)),
  /** Wrap round an inner corner, mm (norm `wallpaper.cornerWrap`; the manufacturer may say otherwise). */
  wrapMm: z.int().check(z.minimum(0), z.maximum(100)),
  /** Spare rolls on top of the cutting plan (one batch for touch-ups). */
  spareRolls: z.int().check(z.minimum(0), z.maximum(5)),
  rollWidthMm: z.int().check(z.minimum(300), z.maximum(1500)),
  rollLengthMm: z.int().check(z.minimum(5000), z.maximum(50_000)),
  /** Pattern repeat (раппорт); 0 = plain or free match. */
  /** The wallpaper has a pattern to match: only then the repeat and its match count. */
  pattern: z.boolean(),
  repeatMm: z.int().check(z.minimum(0), z.maximum(1500)),
  match: z.enum(["straight", "offset"]),
  /** Trim allowance per strip, top and bottom together (norm `wallpaper.trimAllowance`). */
  trimMm: z.int().check(z.minimum(0), z.maximum(300)),
  /** Wall area one pack of paste covers, from the pack (norms `wallpaperPaste.coverage.*` by wallpaper type). */
  pasteCoverageM2: z.number().check(z.minimum(1), z.maximum(200)),
  /** Sets the paste (another product for paper) and, in the form, its coverage (norms `wallpaperPaste.coverage.*`). */
  wallpaperType: z.enum(["nonwoven", "heavy", "paper"]),
  /** Primer under the wallpaper, one coat (norm `primer.consumption`), one canister size as in paint. */
  primer: z.boolean(),
  primerRateLPerM2: z.number().check(z.minimum(0.05), z.maximum(1)),
  primerPackL: z.number().check(z.minimum(0.5), z.maximum(50)),
});

export type OboiInput = z.infer<typeof input>;

/**
 * How far a strip wraps round an inner corner (norm `wallpaper.cornerWrap`): 10–15 mm (РБК Недвижимость),
 * 1,5–5 cm (oboi-store) — 15 mm fits both.
 */
export const WALLPAPER_CORNER_WRAP_MM = 15;
/** A strip turns into pieces only 2 cm or more inside a window on both sides (practice, placing error). */
const WINDOW_MARGIN_MM = 20;
/** The rest of a corner strip narrower than this is waste, not hung on the next wall (practice, master review). */
const MIN_CARRY_MM = 50;

/** Shorter gaps above an opening are closed by the trim and the casing: no piece, no phantom roll. */
const MIN_PIECE_MM = 50;
/** Roll length tolerance of ГОСТ 6810 (norm `wallpaper.rollLengthTolerance`): warn when strips leave less. */
const ROLL_TOLERANCE = 0.015;

/**
 * Width of an opening that a full-height strip can be left out of. A strip that only partly covers the
 * opening still runs floor to ceiling, so on average only `width − roll width` is saved.
 */
const savedWidthMm = (o: OboiInput["openings"][number], rollWidthMm: number) => Math.max(o.widthMm - rollWidthMm, 0);

/** Pieces above a door or above and below a window: one per strip left out across the opening. */
function openingPieces(i: OboiInput, openings: OboiInput["openings"]): number[] {
  return openings.flatMap((o) => {
    const rest = i.heightMm - o.heightMm;
    if (rest < MIN_PIECE_MM) return [];
    const length = rest + (o.type === "window" ? 2 : 1) * i.trimMm;
    const count = Math.ceil(savedWidthMm(o, i.rollWidthMm) / i.rollWidthMm) * o.count;
    return Array.from({ length: count }, () => length);
  });
}

/** Outer corners of an L-shaped room take a wider wrap (norm `wallpaper.outerCornerWrap`: 3–4 cm). */
export const WALLPAPER_OUTER_WRAP_MM = 30;
/** Full-height parts narrower than this are awkward to hang straight; the start is chosen to avoid them. */
const NARROW_MM = 100;
/** From this width a roll is non-woven (pasted on the wall). */
const WIDE_ROLL_MM = 1000;
/** Rests narrower or shorter than this are waste. */
const MIN_REST_MM = 100;
/** Start lines tried on every wall: this step across the roll width, plus lines at corners and openings. */
const LINE_STEP_MM = 50;

/** Area of a union of rectangles, mm² (coordinate compression: a wall has a handful). */
function unionArea(rects: readonly ElevationOpening[]): number {
  const xs = [...new Set(rects.flatMap((r) => [r.x, r.x + r.w]))].sort((a, b) => a - b);
  let area = 0;
  for (let k = 0; k + 1 < xs.length; k++) {
    const a = xs[k] as number;
    const b = xs[k + 1] as number;
    const spans = rects
      .filter((r) => r.x <= a && r.x + r.w >= b)
      .map((r) => [r.y, r.y + r.h] as const)
      .sort((p, q) => p[0] - q[0]);
    let covered = 0;
    let top = 0;
    let bottom = 0;
    for (const [y0, y1] of spans) {
      if (y0 > bottom) {
        covered += bottom - top;
        top = y0;
        bottom = y1;
      } else bottom = Math.max(bottom, y1);
    }
    covered += bottom - top;
    area += (b - a) * covered;
  }
  return area;
}

/** The room unfolded: walls, doors, windows and bare zones on each, wraps at the corners. */
interface RoomWalls {
  outline: ReturnType<typeof roomOutline>;
  openings: ElevationOpening[][];
  wraps: number[];
  outer: number;
  marks: LayoutMark[];
  defaultSill: boolean;
  /** Every counted door and window is placed: the strips can be hung wall by wall. */
  all: boolean;
  doorCenter?: readonly [number, number];
  /** Bare area that is not an opening already, m². */
  bareM2: number;
}

function roomWalls(i: OboiInput, openings: OboiInput["openings"], warnings: Warning[]): RoomWalls {
  const real =
    i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0 && i.cutLengthMm < i.lengthMm && i.cutWidthMm < i.widthMm;
  const outline = roomOutline(
    i.lengthMm,
    i.widthMm,
    real ? { lengthMm: i.cutLengthMm, widthMm: i.cutWidthMm } : undefined,
    i.cutCorner,
  );
  const count = outline.walls.length;
  const { placed, off } = placeOpenings(outline.walls, openings);
  if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });
  const total = openings.reduce((n, o) => n + o.count, 0);
  const perWall = outline.walls.map((_, k) => wallOpenings(placed, k, i.heightMm));
  const aboveCeiling = perWall.reduce((n, w) => n + w.aboveCeiling, 0);
  if (aboveCeiling > 0)
    warnings.push({ code: "window_above_ceiling", level: "warning", values: { count: aboveCeiling } });
  const ops = perWall.map((w) => [...w.openings]);
  let zonesOff = 0;
  for (const z of i.zones) {
    const wall = outline.walls[z.wall];
    if (!wall) {
      zonesOff++;
      continue;
    }
    const x = Math.min(z.offsetMm, Math.max(wall.lengthMm - z.widthMm, 0));
    const w = Math.min(z.widthMm, wall.lengthMm);
    const h = Math.min(z.heightMm, Math.max(i.heightMm - z.fromFloorMm, 0));
    if (x !== z.offsetMm || w !== z.widthMm || h !== z.heightMm) zonesOff++;
    if (h > 0) ops[z.wall]?.push({ type: "bare", x, y: i.heightMm - z.fromFloorMm - h, w, h });
  }
  if (zonesOff > 0) warnings.push({ code: "zone_off_wall", level: "warning", values: { count: zonesOff } });
  // A corner is inner when the outline turns right (clockwise, y down), outer when it turns left.
  const outerCorners = outline.walls.map((a, k) => {
    const b = outline.walls[(k + 1) % count] as PlanWall;
    const cross = Math.sign(a.x2 - a.x1) * Math.sign(b.y2 - b.y1) - Math.sign(a.y2 - a.y1) * Math.sign(b.x2 - b.x1);
    return cross < 0;
  });
  const wraps = outerCorners.map((outer) => (outer ? WALLPAPER_OUTER_WRAP_MM : i.wrapMm));
  const door = placed.find((p) => p.type === "door");
  const bareM2 = ops.reduce((n, list) => {
    const holes = list.filter((o) => o.type !== "bare");
    return n + mm2ToM2(unionArea(list) - unionArea(holes));
  }, 0);
  return {
    outline,
    openings: ops,
    wraps,
    outer: outerCorners.filter(Boolean).length,
    marks: placed.map((p) => p.mark),
    defaultSill: perWall.some((w) => w.defaultSill),
    all: placed.length === total,
    ...(door ? { doorCenter: [(door.mark.x1 + door.mark.x2) / 2, (door.mark.y1 + door.mark.y2) / 2] as const } : {}),
    bareM2,
  };
}

/** One way to hang the room: where the first level line is, where the two directions meet, and its cutting plan. */
interface Choice {
  wall: number;
  lineMm: number;
  closingCorner: number;
  hang: HangResult;
  cut?: Cutting;
}

/** The cutting plan of a hang and, for each strip and part of it, the blank or piece it comes from. */
interface Cutting {
  plan: CutPlan;
  /** Strips cut from the rolls; `also` — a second narrow strip cut from the same one (the other side of it). */
  strips: (HangBlank & { also?: HangBlank })[];
  parts: ({ kind: "narrow"; blank: HangBlank } | { kind: "piece"; piece: HangResult["pieces"][number] })[];
}

function cutting(i: OboiInput, hang: HangResult, stripMm: number, lucky = false, quick = false): Cutting {
  const half = i.match === "offset" ? i.repeatMm / 2 : 0;
  const phase = (order: number) => (Math.abs(order) % 2 === 1 ? half : 0);
  const strips: Cutting["strips"] = [];
  const parts: Cutting["parts"] = [];
  const used = (b: HangBlank) => b.parts.reduce((n, p) => n + p.widthMm, 0);
  const narrow = (b: HangBlank) => b.parts.length === 1 && used(b) < i.rollWidthMm - 1e-6;
  // With a pattern the two closing strips keep their side of the roll: the clockwise one its left edge, the
  // anticlockwise one its right edge. When they fit side by side at the same pattern phase, one strip gives both.
  let pair: [HangBlank, HangBlank] | undefined;
  if (i.repeatMm > 0) {
    const cw = [...hang.blanks].reverse().find((b) => b.order >= 0 && narrow(b));
    const ccw = [...hang.blanks].reverse().find((b) => b.order < 0 && narrow(b));
    if (cw && ccw && used(cw) + used(ccw) <= i.rollWidthMm && phase(cw.order) === phase(ccw.order)) pair = [cw, ccw];
  }
  for (const blank of hang.blanks) {
    if (pair && blank === pair[1]) continue;
    if (pair && blank === pair[0]) {
      strips.push({ ...blank, restMm: i.rollWidthMm - used(pair[0]) - used(pair[1]), also: pair[1] });
      continue;
    }
    // Without a pattern a narrow closing strip is just a long narrow part: it may come from another strip's rest.
    if (i.repeatMm === 0 && narrow(blank)) parts.push({ kind: "narrow", blank });
    else strips.push(blank);
  }
  for (const piece of hang.pieces) parts.push({ kind: "piece", piece });
  const plan = planCuts({
    rollWidthMm: i.rollWidthMm,
    rollLengthMm: i.rollLengthMm,
    repeatMm: i.repeatMm,
    luckyStart: lucky,
    strips: strips.map((b) => ({
      lengthMm: stripMm,
      phaseMm: phase(b.order),
      restMm: b.restMm,
      // What is trimmed off over openings (below the top half of the trim); a strip with a side rest keeps only that.
      ...(b.cutouts && !b.also && b.restMm <= 0
        ? { cutouts: b.cutouts.map((c) => ({ ...c, fromMm: c.fromMm + i.trimMm / 2 })) }
        : {}),
    })),
    parts: parts.map((p) =>
      p.kind === "narrow"
        ? { widthMm: p.blank.parts[0]?.widthMm ?? i.rollWidthMm, lengthMm: stripMm, phaseMm: phase(p.blank.order) }
        : { widthMm: p.piece.widthMm, lengthMm: p.piece.lengthMm, phaseMm: phase(p.piece.order) + p.piece.y },
    ),
    minRestMm: MIN_REST_MM,
    quick,
  });
  return { plan, strips, parts };
}

/**
 * Where the strips start and meet. Every wall is tried with level lines across one roll width (the grid
 * repeats every width), at the openings (a strip wholly across a window needs no full-height strip) and at the
 * corner; the two directions meet either in the corner before the start wall (one direction round the room) or
 * in the least visible corner — by the door, never at the main wall. The cutting plan decides between the best
 * few: first no part under 5 cm, then the fewest rolls, then the fewest awkward narrow parts, then the joint out
 * of sight, then the fewest strips — compared strictly in that order. Every candidate gets a quick cutting
 * estimate (one order); the best twelve get the full plan. A manual start or a symmetric main wall fixes the line; the joint is still chosen.
 */
function chooseStart(i: OboiInput, rw: RoomWalls, stripMm: number, edge = i.aroundOpenings === "edge") {
  const { outline } = rw;
  const walls = outline.walls;
  const count = walls.length;
  const W = i.rollWidthMm;
  const mid = (k: number) => {
    const w = walls[k] as PlanWall;
    return [(w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2] as const;
  };
  const dist = (a: readonly [number, number], b: readonly [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  // The main wall: what you see coming in (farthest from the door), else the longest.
  const longest = walls.reduce((b, w, k) => (w.lengthMm > (walls[b] as PlanWall).lengthMm ? k : b), 0);
  const door = rw.doorCenter;
  const autoMain = door ? walls.reduce((b, _, k) => (dist(mid(k), door) > dist(mid(b), door) ? k : b), 0) : longest;
  const main = i.mainWall > 0 && i.mainWall <= count ? i.mainWall - 1 : autoMain;
  // The least visible corner: the one nearest the door, else the farthest from the main wall.
  const corner = (k: number) => [walls[k]?.x2 ?? 0, walls[k]?.y2 ?? 0] as const;
  const corners = walls.map((_, k) => k);
  const hidden = door
    ? corners.reduce((b, k) => (dist(corner(k), door) < dist(corner(b), door) ? k : b), 0)
    : corners.reduce((b, k) => (dist(corner(k), mid(main)) > dist(corner(b), mid(main)) ? k : b), 0);
  const visibility = (k: number) => (k === hidden ? 0 : k === main || (k + 1) % count === main ? 2 : 1);

  const hangAt = (wall: number, lineMm: number, closingCorner: number) =>
    hangStrips(
      {
        walls: walls.map((w, k) => ({ lengthMm: w.lengthMm, openings: rw.openings[k] ?? [] })),
        wrapsMm: rw.wraps,
        heightMm: i.heightMm,
        rollWidthMm: W,
        minCarryMm: MIN_CARRY_MM,
        minPieceMm: MIN_PIECE_MM,
        trimMm: i.trimMm,
        marginMm: WINDOW_MARGIN_MM,
        start: { wall, lineMm },
        closingCorner,
        // Cut at the edges of openings only without a pattern: with one, pieces keep their place across the roll.
        edgeCut: edge && i.repeatMm === 0,
        keepWidth: i.repeatMm > 0,
        // Metre-wide rolls are non-woven, pasted on the wall: what is trimmed off over an opening is dry and clean.
        // Narrow ones are often paper pasted on the strip — a soaked off-cut is not counted (master review).
        cutouts: i.rollWidthMm >= WIDE_ROLL_MM,
      },
      NARROW_MM,
    );
  // Hard faults: a full-height part under 5 cm, or a closing corner the two sides cannot overlap by the wrap.
  const tiny = (c: Choice) =>
    (c.hang.narrowestMm < MIN_CARRY_MM ? 1 : 0) +
    (c.hang.closingOverlapMm < (rw.wraps[c.closingCorner] ?? 0) - 1e-6 ? 1 : 0);
  // Strictly in this order: no part under 5 cm, rolls, awkward inserts and slivers of pieces, the joint out of
  // sight, strips, tail.
  const key = (c: Choice, rolls: number, tail: number) => [
    tiny(c),
    rolls,
    c.hang.narrow + c.hang.slivers,
    // Joints at the corners of doors and windows may crack: as few as the rolls allow.
    c.hang.edges,
    visibility(c.closingCorner),
    c.hang.blanks.length,
    -tail,
  ];
  const compare = (a: number[], b: number[]) => {
    for (let k = 0; k < a.length; k++) {
      const d = (a[k] ?? 0) - (b[k] ?? 0);
      if (Math.abs(d) > 1e-9) return d;
    }
    return 0;
  };
  const keys = new Map<Choice, number[]>();
  const quick = (c: Choice) => {
    const plan = cutting(i, c.hang, stripMm, false, true).plan;
    keys.set(c, key(c, plan.fits ? plan.rolls.length : Number.POSITIVE_INFINITY, plan.tailMm));
    return c;
  };
  const full = (c: Choice) => {
    c.cut = cutting(i, c.hang, stripMm);
    keys.set(c, key(c, c.cut.plan.fits ? c.cut.plan.rolls.length : Number.POSITIVE_INFINITY, c.cut.plan.tailMm));
    return c;
  };
  const make = (wall: number, lineMm: number, closingCorner: number): Choice => ({
    wall,
    lineMm,
    closingCorner,
    hang: hangAt(wall, lineMm, closingCorner),
  });
  const before = (wall: number) => (wall - 1 + count) % count;
  // Every candidate gets a quick cutting estimate; the best few get the full one, which decides.
  const pick = (list: Choice[], top = 12) => {
    // A hang with many more strips than the best one cannot need fewer rolls: no need to cut it.
    const fewest = Math.min(...list.map((c) => c.hang.blanks.length));
    const best = list
      .filter((c) => c.hang.blanks.length <= fewest + 3)
      .map(quick)
      .sort((a, b) => compare(keys.get(a) ?? [], keys.get(b) ?? []))
      .slice(0, top)
      .map(full);
    return best.sort((a, b) => compare(keys.get(a) ?? [], keys.get(b) ?? []))[0] as Choice;
  };
  const closings = (wall: number) => [...new Set([before(wall), hidden])];
  const cornerLine = (wall: number) => Math.min(W - (rw.wraps[before(wall)] ?? 0), walls[wall]?.lengthMm ?? 0);

  // The classic start — in a corner, one direction round the room — for comparison in the guide.
  const cornerStart = pick(
    walls.map((_, k) => make(k, cornerLine(k), before(k))),
    count,
  );

  let mode: "auto" | "manual" | "symmetric" = "auto";
  let chosen: Choice;
  if (i.startMode === "manual") {
    mode = "manual";
    const wall = Math.min(Math.max(i.startWall - 1, 0), count - 1);
    const L = walls[wall]?.lengthMm ?? 0;
    // A line closer to the corner than a usable rest would leave a sliver: it goes to the corner line instead.
    const line = i.startLineMm < MIN_CARRY_MM ? cornerLine(wall) : Math.min(i.startLineMm, L);
    chosen = pick(closings(wall).map((c) => make(wall, line, c)));
  } else if (i.symmetric) {
    mode = "symmetric";
    const L = walls[main]?.lengthMm ?? 0;
    // A strip in the middle of the main wall, or a joint in the middle: whichever the plan prefers.
    const lines = [L / 2 + W / 2, L / 2].filter((p) => p > 0 && p <= L);
    chosen = pick(lines.flatMap((p) => closings(main).map((c) => make(main, p, c))));
  } else {
    const list: Choice[] = [];
    walls.forEach((w, k) => {
      const span = Math.min(W, w.lengthMm);
      const lines = new Set<number>();
      for (let p = LINE_STEP_MM; p <= span; p += LINE_STEP_MM) lines.add(p);
      lines.add(cornerLine(k));
      const fold = (p: number) => {
        const r = ((((p - 1) % W) + W) % W) + 1;
        if (r <= w.lengthMm) lines.add(r);
      };
      for (const o of rw.openings[k] ?? []) {
        const m = o.type === "door" ? 0 : WINDOW_MARGIN_MM;
        for (const p of [o.x + m, o.x + o.w - m, o.x, o.x + o.w]) fold(p);
      }
      for (const p of lines) for (const c of closings(k)) list.push(make(k, p, c));
    });
    chosen = pick(list);
  }
  return { chosen, cornerStart, main, hidden, mode };
}

/** The scheme: every wall unfolded with its strips and pieces, the roll cut map and the guide. */
function wallpaperLayout(i: OboiInput, rw: RoomWalls, start: ReturnType<typeof chooseStart>): Layout {
  const { outline } = rw;
  const { chosen } = start;
  const hang = chosen.hang;
  const H = i.heightMm;
  const marks = [...rw.marks];
  const wall0 = outline.walls[chosen.wall];
  if (wall0) {
    const dx = Math.sign(wall0.x2 - wall0.x1);
    const dy = Math.sign(wall0.y2 - wall0.y1);
    const x = wall0.x1 + dx * chosen.lineMm;
    const y = wall0.y1 + dy * chosen.lineMm;
    const reach = Math.min(wall0.lengthMm / 3, 1000);
    marks.unshift({ kind: "start", x1: x, y1: y, x2: x + dx * reach, y2: y + dy * reach });
  }
  let whole = 0;
  let cutCount = 0;
  let reused = 0;
  const elevations: LayoutElevation[] = outline.walls.map((wall, k) => {
    const hanged = hang.walls[k];
    const pieces: LayoutPiece[] = [];
    for (const c of hanged?.columns ?? []) {
      if (c.kind === "pieces") {
        for (const p of c.pieces ?? []) pieces.push({ x: p.x, y: p.y, w: p.w, h: p.h, cut: false, piece: c.n });
        continue;
      }
      if (c.kind === "full") whole++;
      else if (c.kind === "carry") reused++;
      else cutCount++;
      pieces.push({
        x: c.x,
        y: 0,
        w: c.w,
        h: H,
        cut: c.kind !== "full",
        ...(c.kind === "carry" ? { reused: true } : {}),
        row: c.n - 1,
      });
    }
    const edgesMm = hanged?.edgesMm ?? [];
    return {
      wall: k,
      lengthMm: wall.lengthMm,
      heightMm: H,
      pieces,
      openings: rw.openings[k] ?? [],
      strips: {
        columns: (hanged?.columns ?? []).map((c) => ({ n: c.n, kind: c.kind, xMm: c.x, widthMm: c.w })),
        ...(edgesMm.length > 0 ? { edgesMm } : {}),
        linesMm: hanged?.linesMm ?? [],
        pieces: (hanged?.columns ?? []).flatMap((c) =>
          (c.pieces ?? []).map((p) => ({ n: c.n, where: p.where, lengthMm: p.lengthMm })),
        ),
      },
    };
  });

  let rolls: LayoutRoll[] | undefined;
  const cut = chosen.cut;
  if (cut?.plan.fits) {
    rolls = cut.plan.rolls.map((roll) => ({
      cuts: roll.cuts.map((c) => {
        const at = {
          fromMm: c.fromMm,
          lengthMm: c.lengthMm,
          xMm: c.xMm,
          widthMm: c.widthMm,
          fromRest: c.fromRest,
          ...(c.fromCutout ? { fromCutout: true } : {}),
        };
        if (c.kind === "strip") {
          const blank = cut.strips[c.index];
          return {
            ...at,
            strip: blank?.n ?? 0,
            ...(blank?.also ? { also: blank.also.n } : {}),
            parts: [...(blank?.parts ?? []), ...(blank?.also?.parts ?? [])],
          };
        }
        const part = cut.parts[c.index];
        if (part?.kind === "narrow") return { ...at, strip: part.blank.n, parts: part.blank.parts };
        return {
          ...at,
          piece: part?.piece.n ?? 0,
          ...(part ? { where: part.piece.where, parts: [{ wall: part.piece.wall, widthMm: c.widthMm }] } : {}),
        };
      }),
      rests: roll.rests,
      tailMm: Math.max(
        0,
        ...roll.rests.filter((r) => r.xMm <= 1e-6 && r.widthMm >= i.rollWidthMm - 1e-6).map((r) => r.lengthMm),
      ),
      usedM2: roll.usedM2,
      restM2: roll.restM2,
      wasteM2: roll.wasteM2,
    }));
  }

  const cm = (mm: number) => Math.round(mm) / 10;
  const count = outline.walls.length;
  const c = chosen.closingCorner;
  const guide: Step[] = [];
  guide.push({
    code: start.mode === "manual" ? "start_manual" : start.mode === "symmetric" ? "start_symmetric" : "start_line",
    values: { wall: chosen.wall + 1, line: cm(chosen.lineMm) },
  });
  const rollsOf = (x: Choice) => x.cut?.plan.rolls.length ?? 0;
  if (start.mode === "auto" && rollsOf(chosen) < rollsOf(start.cornerStart))
    guide.push({ code: "why_rolls", values: { rolls: rollsOf(chosen), corner: rollsOf(start.cornerStart) } });
  if (start.mode !== "auto" && rollsOf(chosen) > rollsOf(start.cornerStart))
    guide.push({ code: "manual_more", values: { rolls: rollsOf(chosen), auto: rollsOf(start.cornerStart) } });
  const piecesColumns = new Set(hang.pieces.map((p) => p.n)).size;
  if (piecesColumns > 0) guide.push({ code: "why_pieces", values: { count: piecesColumns } });
  if (hang.narrow === 0) guide.push({ code: "why_narrow", values: { min: cm(NARROW_MM) } });
  const a = c + 1;
  const b = ((c + 1) % count) + 1;
  const oneWay = c === (chosen.wall - 1 + count) % count;
  guide.push({ code: c === start.hidden ? "closing_hidden" : "closing", values: { a, b } });
  guide.push({ code: oneWay ? "order_one" : "order_two", values: { a, b } });
  guide.push({ code: "corner_inner", values: { wrap: cm(i.wrapMm) } });
  if (rw.outer > 0) guide.push({ code: "corner_outer", values: { wrap: cm(WALLPAPER_OUTER_WRAP_MM) } });
  if (reused > 0) guide.push({ code: "carry_level", values: { min: cm(MIN_CARRY_MM) } });
  if (hang.edges > 0) guide.push({ code: "edge_cut", values: { count: hang.edges } });
  rw.openings.forEach((list, k) => {
    const hanged = hang.walls[k];
    const across = (col: { x: number; w: number }, o: ElevationOpening) =>
      col.x < o.x + o.w - 1e-6 && col.x + col.w > o.x + 1e-6;
    for (const o of list) {
      if (o.type === "bare") continue;
      const inside = (hanged?.columns ?? []).filter((col) => col.kind === "pieces" && across(col, o)).length;
      const around = (hanged?.columns ?? []).filter(
        (col) => col.kind !== "pieces" && col.kind !== "edge" && across(col, o),
      ).length;
      const code = o.type === "door" ? "door" : "window";
      guide.push({
        code: around === 0 && inside > 0 ? `${code}_pieces` : code,
        values: { wall: k + 1, around, pieces: inside },
      });
    }
    // A door beside a window (a balcony block) is papered round as one opening.
    const real = list.filter((o) => o.type !== "bare").sort((a, b) => a.x - b.x);
    if (
      real.some(
        (o, j) =>
          j > 0 && o.x - ((real[j - 1] as ElevationOpening).x + (real[j - 1] as ElevationOpening).w) <= BLOCK_GAP_MM,
      )
    )
      guide.push({ code: "one_opening", values: { wall: k + 1 } });
  });
  const fromCutouts = rolls?.reduce((n, r) => n + r.cuts.filter((c) => c.fromCutout).length, 0) ?? 0;
  if (fromCutouts > 0) guide.push({ code: "pieces_cutouts", values: { count: fromCutouts } });
  const bare = rw.openings.reduce((n, list) => n + list.filter((o) => o.type === "bare").length, 0);
  if (bare > 0) guide.push({ code: "bare", values: { count: bare } });
  if (i.repeatMm > 0) guide.push({ code: "repeat", values: { repeat: cm(i.repeatMm) } });
  guide.push({ code: "trim", values: { trim: cm(i.trimMm / 2) } });
  if (rw.defaultSill && rw.openings.some((o) => o.some((x) => x.type === "window")))
    guide.push({ code: "walls_sill", values: { sill: WINDOW_SILL_MM / 10 } });
  guide.push({ code: "avoid", values: {} });

  return {
    kind: "strips",
    widthMm: i.lengthMm,
    heightMm: i.widthMm,
    outline: outline.points,
    walls: outline.walls,
    pieces: [],
    marks,
    elevations,
    ...(rolls
      ? {
          rolls,
          roll: {
            widthMm: i.rollWidthMm,
            lengthMm: i.rollLengthMm - (i.repeatMm > 0 ? i.repeatMm - 1 : 0),
          },
        }
      : {}),
    start: { wall: chosen.wall, lineMm: chosen.lineMm, closingCorner: c },
    guide,
    stats: { whole, cut: cutCount, reused, wasteM2: rolls ? rolls.reduce((n, r) => n + r.wasteM2, 0) : 0 },
  };
}
/**
 * Wallpaper by strips, not by area. Full-height strips cover the perimeter minus, per opening, the width a
 * whole strip can be left out of (width − roll width); each strip is height + trim, aligned to the pattern
 * repeat with the worst-case start of every roll. Pieces above doors and above/below windows are cut from roll
 * tails first (the above and below pieces of a window as one cut). Rolls come from `cutStrips`; paste by net
 * wall area and the pack's coverage. L-shaped rooms share the rectangle's perimeter.
 */
export const oboi: ToolModule<OboiInput> = {
  id: "oboi",
  // 2: with every door and window placed, strips are counted wall by wall (corners, rests, pieces by position).
  // 3: the start is chosen (level line, two directions, closing corner), narrow strips and pieces are cut from the
  //    rests of other strips (a cutting plan), bare zones, L-shaped rooms with outer corners, spare rolls.
  // 4: a door beside a window is one opening, what is trimmed off over openings is a rest for pieces, and strips
  //    may be cut at the edges of openings (`aroundOpenings: "edge"`).
  // 5: the paste by wallpaper type (Metylan datasheets): 42 m² per 300 g for non-woven, 36 for heavy, 35 per
  //    250 g of a paper paste — was 30 m² per 250 g, unconfirmed.
  // 6: the repeat counts only with «Рисунок нужно совмещать» on (owner, 2026-10-14).
  version: 6,
  input,
  upgrade: patternFromRepeat,
  defaults: () => ({
    lengthMm: 4600,
    widthMm: 4300,
    shape: "rect",
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    cutCorner: "se",
    heightMm: 2700,
    // The example plan of every tool: door in the bottom wall, window in the left one.
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 3, offsetMm: 1550 }] },
    ],
    zones: [],
    startMode: "auto",
    startWall: 1,
    startLineMm: 500,
    symmetric: false,
    aroundOpenings: "whole",
    mainWall: 0,
    wrapMm: WALLPAPER_CORNER_WRAP_MM,
    spareRolls: 0,
    rollWidthMm: 530,
    rollLengthMm: 10_050,
    pattern: false,
    repeatMm: 0,
    match: "straight",
    trimMm: 100,
    pasteCoverageM2: 42,
    wallpaperType: "nonwoven",
    primer: true,
    primerRateLPerM2: 0.15,
    primerPackL: 10,
  }),
  compute(i): ToolResult {
    i = { ...i, repeatMm: i.pattern ? i.repeatMm : 0 };
    const warnings: Warning[] = [];
    const openings = i.openings.filter((o) => o.count > 0);
    const lShape = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
    const real = lShape && i.cutLengthMm < i.lengthMm && i.cutWidthMm < i.widthMm;
    if (lShape && !real) warnings.push({ code: "cut_too_large", level: "warning" });
    const room: Room = {
      shape: real ? "l" : "rect",
      lengthMm: i.lengthMm,
      widthMm: i.widthMm,
      heightMm: i.heightMm,
      openings,
      ...(real ? { cut: { lengthMm: i.cutLengthMm, widthMm: i.cutWidthMm } } : {}),
    };
    const walls = wallAreaM2(room);
    // The outline of an L-shaped room is as long as its bounding rectangle's.
    const perimeterMm = 2 * (i.lengthMm + i.widthMm);
    const openingsWidthMm = openings.reduce((sum, o) => sum + savedWidthMm(o, i.rollWidthMm) * o.count, 0);
    const coveredMm = Math.max(perimeterMm - openingsWidthMm, 0);
    const stripMm = i.heightMm + i.trimMm;
    const alignedMm = i.repeatMm > 0 ? Math.ceil(stripMm / i.repeatMm) * i.repeatMm : stripMm;
    const rw = roomWalls(i, openings, warnings);
    const areaM2 = Math.max(walls.areaM2 - rw.bareM2, 0);

    const tallest = Math.max(0, ...openings.map((o) => o.heightMm));
    if (tallest > i.heightMm) {
      warnings.push({
        code: "opening_too_tall",
        level: "warning",
        values: { height: mmToM(tallest), wall: mmToM(i.heightMm) },
      });
    }

    const steps: Step[] = [
      {
        code: "perimeter",
        values: { length: mmToM(i.lengthMm), width: mmToM(i.widthMm), perimeter: mmToM(perimeterMm) },
      },
      { code: "strip", values: { height: mmToM(i.heightMm), trim: mmToM(i.trimMm), length: mmToM(stripMm) } },
    ];
    if (i.repeatMm > 0) {
      steps.push({
        code: i.match === "offset" ? "repeat_offset" : "repeat",
        values: { repeat: mmToM(i.repeatMm), length: mmToM(alignedMm), half: mmToM(i.repeatMm / 2) },
      });
    }

    if (walls.openingsExceedWalls || areaM2 <= 0) {
      warnings.push({ code: "openings_exceed_walls", level: "warning" });
      return { items: [], summary: [], warnings, steps };
    }

    const items: PurchaseItem[] = [];
    const R = i.rollLengthMm;
    let rolls = 0;
    let tailMm = 0;
    let strips: number;
    let pieces: number;
    let parts: number;
    let blanks: number;
    let fromRests: number;
    let perRoll = 0;
    let layout: Layout;
    let fits = true;

    if (rw.all) {
      // Every opening placed (or none): hang wall by wall from the chosen start, cut from a real plan.
      const start = chooseStart(i, rw, stripMm);
      const { hang, cut } = start.chosen;
      const plan = cut?.plan as CutPlan;
      strips = hang.blanks.length;
      pieces = hang.pieces.length;
      parts = hang.walls.reduce((n, w) => n + w.columns.filter((c) => c.kind !== "pieces").length, 0) + pieces;
      layout = wallpaperLayout(i, rw, start);
      steps.push({
        code: "hang",
        values: {
          width: mmToM(i.rollWidthMm),
          wall: start.chosen.wall + 1,
          line: mmToM(start.chosen.lineMm),
          strips,
          pieces,
          parts,
        },
      });
      fits = plan.fits;
      const cuts = plan.rolls.flatMap((r) => r.cuts);
      // Every full-length cut is a blank, wherever it comes from; shorter parts cut from rests are counted apart.
      blanks = cuts.filter((c) => c.lengthMm >= stripMm - 1e-6).length;
      fromRests = cuts.filter((c) => c.fromRest && c.lengthMm < stripMm - 1e-6).length;
      if (fits) {
        rolls = plan.rolls.length;
        tailMm = plan.tailMm;
        perRoll = plan.perRoll;
        steps.push({ code: "cut_plan", values: { blanks, fromRests, rolls } });
        if (i.repeatMm > 0) {
          const lucky = cutting(i, hang, stripMm, true).plan.rolls.length;
          if (lucky < rolls)
            warnings.push({
              code: "repeat_lucky_start",
              level: "info",
              values: { rolls: lucky, extra: rolls - lucky },
            });
        }
        if (plan.perRoll > 0 && plan.perRollSlackMm < ROLL_TOLERANCE * R)
          warnings.push({ code: "roll_tight", level: "info", values: { slack: mmToM(plan.perRollSlackMm) } });
      } else if (plan.tooLong === "part") {
        warnings.push({ code: "piece_longer_than_roll", level: "warning", values: { roll: mmToM(R) } });
      } else {
        warnings.push({
          code: "strip_longer_than_roll",
          level: "warning",
          values: { strip: mmToM(stripMm), roll: mmToM(R) },
        });
      }
      // The other way round doors and windows: what it would take, for the hint.
      const edge = i.aroundOpenings === "edge";
      if (edge && i.repeatMm > 0) warnings.push({ code: "edge_pattern", level: "info" });
      const papered = rw.openings.some((list) => list.some((o) => o.type !== "bare"));
      if (fits && papered && i.repeatMm === 0) {
        const other = chooseStart(i, rw, stripMm, !edge).chosen.cut?.plan;
        const otherRolls = other?.fits ? other.rolls.length : undefined;
        if (!edge && otherRolls !== undefined && otherRolls < rolls)
          warnings.push({ code: "edge_saves", level: "info", values: { rolls: otherRolls, now: rolls } });
        if (edge && otherRolls !== undefined && otherRolls <= rolls)
          warnings.push({ code: "edge_no_gain", level: "info", values: { rolls: otherRolls } });
      }
      if (hang.edges > 0) warnings.push({ code: "edge_seams", level: "warning", values: { count: hang.edges } });
      const closingWrap = rw.wraps[start.chosen.closingCorner] ?? 0;
      if (hang.closingOverlapMm < closingWrap - 1e-6)
        warnings.push({
          code: "closing_overlap_short",
          level: "warning",
          values: { overlap: Math.round(Math.max(hang.closingOverlapMm, 0)) / 10, wrap: closingWrap / 10 },
        });
      if (hang.narrow > 0)
        warnings.push({
          code: "narrow_insert",
          level: "info",
          values: { count: hang.narrow, width: Math.round(hang.narrowestMm) / 10 },
        });
    } else {
      // An opening not placed: the perimeter estimate (version 1), the walls drawn empty.
      strips = Math.ceil(coveredMm / i.rollWidthMm);
      const lengths = openingPieces(i, openings);
      pieces = lengths.length;
      parts = strips + pieces;
      blanks = strips;
      steps.push({
        code: "strips",
        values: {
          perimeter: mmToM(perimeterMm),
          openings: mmToM(openingsWidthMm),
          width: mmToM(i.rollWidthMm),
          strips,
        },
      });
      if (pieces > 0) steps.push({ code: "pieces", values: { count: pieces } });
      const stripsOnly = {
        rollLengthMm: R,
        repeatMm: i.repeatMm,
        offset: i.match === "offset",
        stripLengthMm: stripMm,
      };
      const cut = cutStrips({ ...stripsOnly, strips, pieces: lengths });
      fits = cut.fits;
      fromRests = cut.cuts.reduce((n, roll) => n + roll.filter((c, k) => c.kind === "piece" && k > 0).length, 0);
      if (cut.fits) {
        rolls = cut.rolls;
        tailMm = Math.max(0, ...cut.remnantsMm);
        perRoll = cut.perRoll;
        steps.push({ code: "per_roll", values: { roll: mmToM(R), perRoll } });
        const stripRolls = cutStrips({ ...stripsOnly, strips }).rolls;
        steps.push({ code: "strip_rolls", values: { strips, perRoll, rolls: stripRolls } });
        if (cut.rolls > stripRolls) steps.push({ code: "pieces_rolls", values: { extra: cut.rolls - stripRolls } });
        if (i.repeatMm > 0) {
          const lucky = cutStrips({ ...stripsOnly, strips, pieces: lengths, luckyStart: true }).rolls;
          if (lucky < cut.rolls)
            warnings.push({
              code: "repeat_lucky_start",
              level: "info",
              values: { rolls: lucky, extra: cut.rolls - lucky },
            });
        }
        if (cut.perRoll > 0 && cut.perRollSlackMm < ROLL_TOLERANCE * R)
          warnings.push({ code: "roll_tight", level: "info", values: { slack: mmToM(cut.perRollSlackMm) } });
      } else if (cut.tooLong === "piece") {
        warnings.push({ code: "piece_longer_than_roll", level: "warning", values: { roll: mmToM(R) } });
      } else {
        warnings.push({
          code: "strip_longer_than_roll",
          level: "warning",
          values: { strip: mmToM(stripMm), roll: mmToM(R) },
        });
      }
      layout = {
        kind: "strips",
        widthMm: i.lengthMm,
        heightMm: i.widthMm,
        outline: rw.outline.points,
        walls: rw.outline.walls,
        pieces: [],
        marks: rw.marks,
        elevations: rw.outline.walls.map((wall, k) => ({
          wall: k,
          lengthMm: wall.lengthMm,
          heightMm: i.heightMm,
          pieces: [],
          openings: rw.openings[k] ?? [],
        })),
        guide: [{ code: "place_openings", values: {} }],
        stats: { whole: 0, cut: 0, reused: 0, wasteM2: 0 },
      };
    }

    if (fits) {
      const bought = rolls + i.spareRolls;
      items.push(
        purchase(
          "wallpaper",
          "main",
          { value: mmToM(bought * R - tailMm), unit: "m" },
          { kind: "roll", size: { value: mmToM(R), unit: "m" }, width: { value: mmToM(i.rollWidthMm), unit: "m" } },
        ),
      );
      if (rw.all) steps.push({ code: "per_roll", values: { roll: mmToM(R), perRoll } });
      steps.push({ code: "rolls", values: { rolls, tail: mmToM(tailMm) } });
      if (i.spareRolls > 0) steps.push({ code: "spare", values: { spare: i.spareRolls, rolls: bought } });
    }

    const paste = purchase(
      "wallpaper-glue",
      "related",
      { value: areaM2, unit: "m2" },
      { kind: "pack", size: { value: i.pasteCoverageM2, unit: "m2" } },
      { variant: i.wallpaperType },
    );
    items.push(paste);
    steps.push(
      rw.bareM2 > 0
        ? {
            code: "area_bare",
            values: { gross: walls.grossM2, openings: walls.openingsM2, bare: rw.bareM2, area: areaM2 },
          }
        : { code: "area", values: { gross: walls.grossM2, openings: walls.openingsM2, area: areaM2 } },
    );
    steps.push({ code: "paste", values: { area: areaM2, coverage: i.pasteCoverageM2, packs: paste.packs } });
    if (i.primer) {
      const primerL = areaM2 * i.primerRateLPerM2;
      const primer = purchase(
        "primer",
        "related",
        { value: primerL, unit: "l" },
        { kind: "canister", size: { value: i.primerPackL, unit: "l" } },
      );
      items.push(primer);
      if (primer.leftover.value > 4 * primerL) {
        warnings.push({ code: "primer_small_need", level: "info", values: { need: primerL, size: i.primerPackL } });
      }
      steps.push({
        code: "primer",
        values: { area: areaM2, rate: i.primerRateLPerM2, litres: primerL, packs: primer.packs, size: i.primerPackL },
      });
    }

    return {
      items,
      summary: [
        { key: "parts", value: parts, unit: "pcs" },
        { key: "blanks", value: blanks, unit: "pcs" },
        { key: "fromRests", value: fromRests, unit: "pcs" },
        { key: "rollsUsed", value: rolls, unit: "pcs" },
        ...(i.spareRolls > 0 ? [{ key: "spare", value: i.spareRolls, unit: "pcs" as const }] : []),
        { key: "strips", value: strips, unit: "pcs" },
        { key: "pieces", value: pieces, unit: "pcs" },
        { key: "stripLength", value: mmToM(alignedMm), unit: "m" },
        { key: "perRoll", value: perRoll, unit: "pcs" },
        { key: "wallArea", value: areaM2, unit: "m2" },
        ...(rw.bareM2 > 0 ? [{ key: "bareArea", value: rw.bareM2, unit: "m2" as const }] : []),
      ],
      warnings,
      steps,
      layout,
    };
  },
};
