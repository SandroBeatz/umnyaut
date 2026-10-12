import * as z from "zod/mini";
import {
  cutStrips,
  type HangResult,
  hangStrips,
  mmToM,
  openingInputSchema,
  placeOpenings,
  purchase,
  roomOutline,
  type StripCut,
  wallAreaM2,
  wallOpenings,
} from "../../blocks";
import type {
  Layout,
  LayoutElevation,
  LayoutMark,
  LayoutPiece,
  LayoutRoll,
  PurchaseItem,
  Room,
  Step,
  ToolModule,
  ToolResult,
  Warning,
} from "../../types";

const length = z.int().check(z.minimum(300), z.maximum(100_000));

/** Shared with every tool, so the plan places of openings survive between tools. */
const opening = openingInputSchema;

const input = z.object({
  lengthMm: length,
  widthMm: length,
  heightMm: z.int().check(z.minimum(1000), z.maximum(10_000)),
  openings: z.readonly(z.array(opening).check(z.maxLength(20))),
  rollWidthMm: z.int().check(z.minimum(300), z.maximum(1500)),
  rollLengthMm: z.int().check(z.minimum(5000), z.maximum(50_000)),
  /** Pattern repeat (раппорт); 0 = plain or free match. */
  repeatMm: z.int().check(z.minimum(0), z.maximum(1500)),
  match: z.enum(["straight", "offset"]),
  /** Trim allowance per strip, top and bottom together (norm `wallpaper.trimAllowance`). */
  trimMm: z.int().check(z.minimum(0), z.maximum(300)),
  /** Wall area one pack of paste covers, from the pack (norm `wallpaperPaste.coverage`). */
  pasteCoverageM2: z.number().check(z.minimum(1), z.maximum(200)),
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

/** The room as hung: walls from the start corner, placed doors and windows on each; `hang` once all are placed. */
interface HangPlan {
  outline: ReturnType<typeof roomOutline>;
  marks: LayoutMark[];
  /** Wall indices in hanging order, starting with the start wall. */
  order: number[];
  openings: ReturnType<typeof wallOpenings>["openings"][];
  defaultSill: boolean;
  window: boolean;
  hang?: HangResult;
}

/**
 * Start at the first corner of the wall with the widest placed window («обои начинают клеить от окна», РБК
 * Недвижимость), wall 1 without one, and go clockwise. Every counted opening placed: strips per wall
 * (`hangStrips`); else no hang and the perimeter count stays.
 */
function hangPlan(i: OboiInput, openings: OboiInput["openings"], warnings: Warning[]): HangPlan {
  const outline = roomOutline(i.lengthMm, i.widthMm);
  const { placed, off } = placeOpenings(outline.walls, openings);
  if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });
  const total = openings.reduce((n, o) => n + o.count, 0);
  const windows = placed.filter((p) => p.type === "window").sort((a, b) => b.widthMm - a.widthMm);
  const start = windows[0]?.wall ?? 0;
  const order = outline.walls.map((_, k) => (start + k) % outline.walls.length);
  const perWall = outline.walls.map((_, k) => wallOpenings(placed, k, i.heightMm));
  const plan: HangPlan = {
    outline,
    marks: placed.map((p) => p.mark),
    order,
    openings: perWall.map((w) => w.openings),
    defaultSill: perWall.some((w) => w.defaultSill),
    window: windows.length > 0,
  };
  if (placed.length !== total) return plan;
  plan.hang = hangStrips({
    walls: order.map((k) => ({ lengthMm: outline.walls[k]?.lengthMm ?? 0, openings: perWall[k]?.openings ?? [] })),
    heightMm: i.heightMm,
    rollWidthMm: i.rollWidthMm,
    wrapMm: WALLPAPER_CORNER_WRAP_MM,
    minCarryMm: MIN_CARRY_MM,
    minPieceMm: MIN_PIECE_MM,
    trimMm: i.trimMm,
  });
  return plan;
}

/** The scheme: every wall unfolded with its strips, the roll cut map and the guide. */
function hangLayout(i: OboiInput, plan: HangPlan, cut: StripCut | undefined, stripMm: number): Layout {
  const { outline, hang, order } = plan;
  const H = i.heightMm;
  const startWall = order[0] ?? 0;
  const wall0 = outline.walls[startWall];
  const marks = [...plan.marks];
  if (wall0) {
    const reach = Math.min(wall0.lengthMm / 3, 1000);
    const dx = Math.sign(wall0.x2 - wall0.x1);
    const dy = Math.sign(wall0.y2 - wall0.y1);
    marks.unshift({ kind: "start", x1: wall0.x1, y1: wall0.y1, x2: wall0.x1 + dx * reach, y2: wall0.y1 + dy * reach });
  }
  let whole = 0;
  let cutCount = 0;
  let reused = 0;
  const elevations: LayoutElevation[] = outline.walls.map((wall, k) => {
    const hanged = hang?.walls[order.indexOf(k)];
    const pieces: LayoutPiece[] = [];
    const own = (hanged?.columns ?? []).filter((c) => c.kind !== "carry");
    const carry = hanged?.columns.find((c) => c.kind === "carry");
    for (const c of hanged?.columns ?? []) {
      if (c.kind === "pieces") {
        for (const p of c.pieces ?? []) pieces.push({ x: c.x, y: p.y, w: c.w, h: p.h, cut: false, row: c.n - 1 });
        continue;
      }
      if (c.kind === "full") whole++;
      else if (c.kind === "corner") cutCount++;
      else reused++;
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
    return {
      wall: k,
      lengthMm: wall.lengthMm,
      heightMm: H,
      pieces,
      openings: plan.openings[k] ?? [],
      ...(hanged
        ? {
            strips: {
              ...(own.length > 0 ? { first: own[0]?.n, last: own.at(-1)?.n } : {}),
              ...(carry ? { carryFrom: carry.n, carryInMm: carry.w } : {}),
              plumbMm: hanged.plumbMm,
              ...(hanged.cornerMm === undefined ? {} : { cornerMm: hanged.cornerMm, carryOutMm: hanged.carryMm ?? 0 }),
              pieces: own.flatMap((c) =>
                (c.pieces ?? []).map((p) => ({ n: c.n, where: p.where, lengthMm: p.lengthMm })),
              ),
            },
          }
        : {}),
    };
  });

  let rolls: LayoutRoll[] | undefined;
  if (hang && cut?.fits) {
    const numbers = hang.walls.flatMap((w) =>
      w.columns.filter((c) => c.kind === "full" || c.kind === "corner").map((c) => c.n),
    );
    rolls = cut.cuts.map((cuts, r) => ({
      cuts: cuts.map((c) => {
        if (c.kind === "strip") return { strip: numbers[c.index] ?? c.index + 1, lengthMm: stripMm };
        const piece = hang.pieces[c.index];
        return { strip: piece?.n ?? 0, lengthMm: piece?.lengthMm ?? 0, ...(piece ? { where: piece.where } : {}) };
      }),
      tailMm: cut.remnantsMm[r] ?? 0,
    }));
  }

  const cm = (mm: number) => Math.round(mm) / 10;
  const guide: Step[] = [];
  if (hang) {
    const plumb = hang.walls[0]?.plumbMm ?? 0;
    guide.push({
      code: plan.window ? "start_window" : "start_corner",
      values: { wall: startWall + 1, plumb: cm(plumb) },
    });
    guide.push({ code: "clockwise", values: {} });
    guide.push({ code: "corner_wrap", values: { wrap: cm(WALLPAPER_CORNER_WRAP_MM) } });
    if (reused > 0) guide.push({ code: "carry_level", values: { min: cm(MIN_CARRY_MM) } });
    if (hang.pieces.length > 0) guide.push({ code: "pieces", values: { count: hang.pieces.length } });
    if (i.repeatMm > 0) guide.push({ code: "repeat", values: { repeat: cm(i.repeatMm) } });
    guide.push({ code: "trim", values: { trim: cm(i.trimMm / 2) } });
    if (plan.defaultSill && plan.openings.some((o) => o.some((x) => x.type === "window")))
      guide.push({ code: "walls_sill", values: { sill: 90 } });
  } else {
    guide.push({ code: "place_openings", values: {} });
  }

  return {
    kind: "strips",
    widthMm: i.lengthMm,
    heightMm: i.widthMm,
    outline: outline.points,
    walls: outline.walls,
    pieces: [],
    marks,
    elevations,
    ...(rolls ? { rolls } : {}),
    guide,
    stats: { whole, cut: cutCount, reused, wasteM2: 0 },
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
  version: 2,
  input,
  defaults: () => ({
    lengthMm: 4600,
    widthMm: 4300,
    heightMm: 2700,
    // The example plan of every tool: door in the bottom wall, window in the left one.
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 3, offsetMm: 1550 }] },
    ],
    rollWidthMm: 530,
    rollLengthMm: 10_050,
    repeatMm: 0,
    match: "straight",
    trimMm: 100,
    pasteCoverageM2: 30,
    primer: true,
    primerRateLPerM2: 0.15,
    primerPackL: 10,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const openings = i.openings.filter((o) => o.count > 0);
    const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
    const walls = wallAreaM2(room);
    const perimeterMm = 2 * (i.lengthMm + i.widthMm);
    const openingsWidthMm = openings.reduce((sum, o) => sum + savedWidthMm(o, i.rollWidthMm) * o.count, 0);
    const coveredMm = Math.max(perimeterMm - openingsWidthMm, 0);
    // Every opening placed: strips wall by wall from the start corner; else the perimeter estimate.
    const plan = hangPlan(i, openings, warnings);
    const hang = plan.hang;
    const strips = hang ? hang.strips : Math.ceil(coveredMm / i.rollWidthMm);
    const stripMm = i.heightMm + i.trimMm;
    const alignedMm = i.repeatMm > 0 ? Math.ceil(stripMm / i.repeatMm) * i.repeatMm : stripMm;
    const pieces = hang ? hang.pieces.map((p) => p.lengthMm) : openingPieces(i, openings);

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
    if (hang) {
      steps.push({
        code: "walls_strips",
        values: { width: mmToM(i.rollWidthMm), wrap: WALLPAPER_CORNER_WRAP_MM / 10, strips, pieces: pieces.length },
      });
    } else {
      steps.push({
        code: "strips",
        values: {
          perimeter: mmToM(perimeterMm),
          openings: mmToM(openingsWidthMm),
          width: mmToM(i.rollWidthMm),
          strips,
        },
      });
    }
    if (pieces.length > 0) steps.push({ code: "pieces", values: { count: pieces.length } });

    if (walls.openingsExceedWalls || walls.areaM2 <= 0) {
      warnings.push({ code: "openings_exceed_walls", level: "warning" });
      return { items: [], summary: [], warnings, steps };
    }

    const items: PurchaseItem[] = [];
    const stripsOnly = {
      rollLengthMm: i.rollLengthMm,
      repeatMm: i.repeatMm,
      offset: i.match === "offset",
      stripLengthMm: stripMm,
    };
    const cut = cutStrips({ ...stripsOnly, strips, pieces });
    const layout = hangLayout(i, plan, cut, stripMm);
    if (cut.fits) {
      const tailMm = Math.max(0, ...cut.remnantsMm);
      const stripRolls = cutStrips({ ...stripsOnly, strips }).rolls;
      const needM = mmToM(cut.rolls * i.rollLengthMm - tailMm);
      items.push(
        purchase(
          "wallpaper",
          "main",
          { value: needM, unit: "m" },
          {
            kind: "roll",
            size: { value: mmToM(i.rollLengthMm), unit: "m" },
          },
        ),
      );
      steps.push({ code: "per_roll", values: { roll: mmToM(i.rollLengthMm), perRoll: cut.perRoll } });
      steps.push({ code: "strip_rolls", values: { strips, perRoll: cut.perRoll, rolls: stripRolls } });
      if (cut.rolls > stripRolls) steps.push({ code: "pieces_rolls", values: { extra: cut.rolls - stripRolls } });
      steps.push({ code: "rolls", values: { rolls: cut.rolls, tail: mmToM(tailMm) } });
      // The count above assumes the worst pattern start on every roll; say how many a lucky start needs.
      if (i.repeatMm > 0) {
        const lucky = cutStrips({ ...stripsOnly, strips, pieces, luckyStart: true }).rolls;
        if (lucky < cut.rolls) {
          warnings.push({
            code: "repeat_lucky_start",
            level: "info",
            values: { rolls: lucky, extra: cut.rolls - lucky },
          });
        }
      }
      // Strips that use the roll almost to the end: a roll shorter within the tolerance gives one strip less.
      if (cut.perRoll > 0 && cut.perRollSlackMm < ROLL_TOLERANCE * i.rollLengthMm) {
        warnings.push({ code: "roll_tight", level: "info", values: { slack: mmToM(cut.perRollSlackMm) } });
      }
    } else if (cut.tooLong === "piece") {
      warnings.push({ code: "piece_longer_than_roll", level: "warning", values: { roll: mmToM(i.rollLengthMm) } });
    } else {
      warnings.push({
        code: "strip_longer_than_roll",
        level: "warning",
        values: { strip: mmToM(stripMm), roll: mmToM(i.rollLengthMm) },
      });
    }

    const paste = purchase(
      "wallpaper-glue",
      "related",
      { value: walls.areaM2, unit: "m2" },
      {
        kind: "pack",
        size: { value: i.pasteCoverageM2, unit: "m2" },
      },
    );
    items.push(paste);
    steps.push({ code: "area", values: { gross: walls.grossM2, openings: walls.openingsM2, area: walls.areaM2 } });
    steps.push({ code: "paste", values: { area: walls.areaM2, coverage: i.pasteCoverageM2, packs: paste.packs } });
    if (i.primer) {
      const primerL = walls.areaM2 * i.primerRateLPerM2;
      const primer = purchase(
        "primer",
        "related",
        { value: primerL, unit: "l" },
        {
          kind: "canister",
          size: { value: i.primerPackL, unit: "l" },
        },
      );
      items.push(primer);
      if (primer.leftover.value > 4 * primerL) {
        warnings.push({ code: "primer_small_need", level: "info", values: { need: primerL, size: i.primerPackL } });
      }
      steps.push({
        code: "primer",
        values: {
          area: walls.areaM2,
          rate: i.primerRateLPerM2,
          litres: primerL,
          packs: primer.packs,
          size: i.primerPackL,
        },
      });
    }

    return {
      items,
      summary: [
        { key: "strips", value: strips, unit: "pcs" },
        { key: "stripLength", value: mmToM(alignedMm), unit: "m" },
        { key: "perRoll", value: cut.perRoll, unit: "pcs" },
        { key: "pieces", value: pieces.length, unit: "pcs" },
        { key: "wallArea", value: walls.areaM2, unit: "m2" },
      ],
      warnings,
      steps,
      layout,
    };
  },
};
