import * as z from "zod/mini";
import {
  cornerFlips,
  coverage,
  cutCornerSchema,
  greedyRows,
  layRows,
  lightDirection,
  mm2ToM2,
  openingInputSchema,
  placeOpenings,
  purchase,
  roomOutline,
  rowsLayout,
  traceRows,
} from "../../blocks";
import type { Layout, LayoutMark, PurchaseItem, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.int().check(z.minimum(300), z.maximum(100_000));

const input = z.object({
  shape: z.enum(["rect", "l"]),
  lengthMm: length,
  widthMm: length,
  /** Corner cut-out of an L-shaped room (from “My room”). */
  cutLengthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutWidthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  /** Where the cut-out sits on the plan (scheme only). */
  cutCorner: cutCornerSchema,
  /** Doors and windows; only their places on the plan are used (scheme and laying guide), never the count. */
  openings: z.readonly(z.array(openingInputSchema).check(z.maxLength(20))),
  /** Rows run along the room length or its width. */
  direction: z.enum(["length", "width"]),
  method: z.enum(["straight", "diagonal", "herringbone"]),
  boardLengthMm: z.int().check(z.minimum(300), z.maximum(3000)),
  boardWidthMm: z.int().check(z.minimum(50), z.maximum(500)),
  boardsPerPack: z.int().check(z.minimum(1), z.maximum(50)),
  /** Expansion gap at each wall (norm `laminate.expansionGap`). */
  gapMm: z.int().check(z.minimum(0), z.maximum(30)),
  /** Joint offset between rows and the shortest piece (norm `laminate.minOffset`). */
  minOffsetMm: z.int().check(z.minimum(100), z.maximum(1000)),
  /** Diagonal and herringbone waste, % (norms `laminate.waste.*`, unconfirmed). */
  wastePct: z.number().check(z.minimum(0), z.maximum(40)),
  underlay: z.boolean(),
  underlayRollM2: z.number().check(z.minimum(1), z.maximum(100)),
});

export type LaminatInput = z.infer<typeof input>;

/** Norm `laminate.minLastRow`. */
const MIN_LAST_ROW_MM = 50;
/** Norms `laminate.waste.diagonal`, `laminate.waste.herringbone` (unconfirmed, owner's 15 %). */
export const LAMINATE_WASTE_PCT = { diagonal: 15, herringbone: 15 } as const;
/** Norm `underlay.rollWidth`: an underlay roll is 1 m wide (shop packs, unconfirmed); the length = m² / width. */
export const UNDERLAY_ROLL_WIDTH_MM = 1000;

/**
 * Underlay rolls by strips: strips of the roll width across the room, each as long as the room (shorter in an
 * L-shape's narrow part), cut from rolls; a strip longer than a roll is joined from whole rolls and a rest. Both
 * directions, the fewer rolls win. Never fewer rolls than by area.
 */
function underlayRolls(i: LaminatInput, rollM2: number): { rolls: number; strips: number; alongLength: boolean } {
  const rollMm = Math.round((rollM2 * 1e6) / UNDERLAY_ROLL_WIDTH_MM);
  const cut = cutOf(i);
  const plan = (alongLength: boolean) => {
    const along = alongLength ? i.lengthMm : i.widthMm;
    const across = alongLength ? i.widthMm : i.lengthMm;
    const cutAlong = cut ? (alongLength ? cut.along : cut.across) : 0;
    const cutAcross = cut ? (alongLength ? cut.across : cut.along) : 0;
    const n = Math.ceil(across / UNDERLAY_ROLL_WIDTH_MM - 1e-9);
    const lengths = Array.from({ length: n }, (_, k) =>
      cut && k * UNDERLAY_ROLL_WIDTH_MM >= across - cutAcross ? along - cutAlong : along,
    );
    // Whole rolls for what a strip is longer than a roll; the rests cut from rolls, longest first, first fit.
    let rolls = 0;
    const rests: number[] = [];
    const tails: number[] = [];
    for (const l of lengths) {
      rolls += Math.floor(l / rollMm);
      if (l % rollMm > 0) rests.push(l % rollMm);
    }
    for (const r of rests.sort((a, b) => b - a)) {
      const k = tails.findIndex((t) => t >= r);
      if (k >= 0) tails[k] = (tails[k] as number) - r;
      else {
        rolls++;
        tails.push(rollMm - r);
      }
    }
    return { rolls, strips: n, alongLength };
  };
  const a = plan(true);
  const b = plan(false);
  return b.rolls < a.rolls ? b : a;
}

/** The cut-out if it makes a real L-shape (smaller than the room both ways), else none. */
const cutOf = (i: LaminatInput) =>
  i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0 && i.cutLengthMm < i.lengthMm && i.cutWidthMm < i.widthMm
    ? { along: i.cutLengthMm, across: i.cutWidthMm }
    : undefined;

function straight(i: LaminatInput, alongLength: boolean) {
  const along = (alongLength ? i.lengthMm : i.widthMm) - 2 * i.gapMm;
  const across = (alongLength ? i.widthMm : i.lengthMm) - 2 * i.gapMm;
  const rows = Math.max(Math.ceil(across / i.boardWidthMm), 1);
  const lastRowMm = across - (rows - 1) * i.boardWidthMm;
  // L-shape: rows lying wholly inside the cut-out band (laid last, from the full side) are shorter.
  const cut = cutOf(i);
  const cutAlong = cut ? (alongLength ? cut.along : cut.across) : 0;
  const cutAcross = cut ? (alongLength ? cut.across : cut.along) : 0;
  const fullRows = cut
    ? Math.min(
        Math.max(Math.ceil(((alongLength ? i.widthMm : i.lengthMm) - cutAcross - i.gapMm) / i.boardWidthMm), 0),
        rows,
      )
    : rows;
  const short = Math.max(along - cutAlong, 1);
  const laid = layRows({
    rowLengthMm: Math.max(along, 1),
    rows,
    rowLengthsMm: Array.from({ length: rows }, (_, k) => (k < fullRows ? Math.max(along, 1) : short)),
    boardLengthMm: i.boardLengthMm,
    minPieceMm: i.minOffsetMm,
    minOffsetMm: i.minOffsetMm,
  });
  const relaxed = (laid.plan ?? []).some((r) => r.relaxed);
  // A fitter laying row by row without the optimised plan in hand: the purchase covers that too.
  const greedy = greedyRows({
    rowLengthMm: Math.max(along, 1),
    rows,
    rowLengthsMm: Array.from({ length: rows }, (_, k) => (k < fullRows ? Math.max(along, 1) : short)),
    boardLengthMm: i.boardLengthMm,
    minPieceMm: i.minOffsetMm,
    minOffsetMm: i.minOffsetMm,
  });
  const boards = Math.max(laid.boards, greedy);
  return {
    rows,
    lastRowMm,
    planBoards: laid.boards,
    greedyBoards: greedy,
    boards,
    packs: Math.ceil(boards / i.boardsPerPack),
    relaxed,
    plan: laid.plan ?? [],
    lengths: Array.from({ length: rows }, (_, k) => (k < fullRows ? Math.max(along, 1) : short)),
    cut: cut ? { along: cutAlong, across: cutAcross } : undefined,
    wasteMm: laid.wasteMm,
  };
}

/**
 * Scheme and laying guide for straight laying, from the very plan the boards were counted on. Canonical frame:
 * first row at the start wall, rows from its left corner, the L-cut at the far end of the last rows; mirrored
 * to the plan's cut corner, or (a rectangle) away from a door on the start wall so the laying ends at the door.
 */
function scheme(i: LaminatInput, lay: ReturnType<typeof straight>, alongLength: boolean, warnings: Warning[]): Layout {
  const cut = cutOf(i);
  const outline = roomOutline(
    i.lengthMm,
    i.widthMm,
    cut ? { lengthMm: cut.along, widthMm: cut.across } : undefined,
    i.cutCorner,
  );
  const { placed, off } = placeOpenings(outline.walls, i.openings);
  if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });
  const startSide = alongLength ? "top" : "left";
  const doorOnStart = placed.some((p) => p.type === "door" && outline.walls[p.wall]?.side === startSide);
  const flips = cut ? cornerFlips(i.cutCorner) : { x: !alongLength && doorOnStart, y: alongLength && doorOnStart };
  const traced = traceRows(lay.plan, lay.lengths, i.boardLengthMm, i.minOffsetMm);
  const across = (alongLength ? i.widthMm : i.lengthMm) - 2 * i.gapMm;
  traced.rows.forEach((r, k) => {
    r.widthMm = k === traced.rows.length - 1 ? across - (traced.rows.length - 1) * i.boardWidthMm : i.boardWidthMm;
  });
  const { pieces, start, startWall } = rowsLayout({
    lengthMm: i.lengthMm,
    widthMm: i.widthMm,
    alongLength,
    gapMm: i.gapMm,
    boardLengthMm: i.boardLengthMm,
    boardWidthMm: i.boardWidthMm,
    lastRowMm: lay.lastRowMm,
    rows: traced.rows,
    cut: lay.cut,
    flipX: flips.x,
    flipY: flips.y,
    walls: outline.walls,
  });
  const reused = pieces.filter((p) => p.reused).length;
  const guide: Step[] = [{ code: "start", values: { wall: startWall + 1, gap: i.gapMm } }];
  if (cut) guide.push({ code: "start_l", values: {} });
  else if (placed.some((p) => p.type === "door")) {
    const doorAcross = placed.some(
      (p) => p.type === "door" && outline.walls[p.wall]?.side === (alongLength ? "bottom" : "right"),
    );
    if (doorOnStart || doorAcross) guide.push({ code: "start_door", values: {} });
  }
  const light = lightDirection(
    outline.walls,
    placed.filter((p) => p.type === "window"),
  );
  if (light) guide.push({ code: light === i.direction ? "light_along" : "light_across", values: {} });
  guide.push({ code: "rows", values: { rows: lay.rows, last: lay.lastRowMm / 10 } });
  if (reused > 0) guide.push({ code: "reuse", values: { count: reused } });
  if (placed.length === 0) guide.push({ code: "place_openings", values: {} });
  const marks: LayoutMark[] = [start, ...placed.map((p) => p.mark)];
  return {
    kind: "rows",
    widthMm: i.lengthMm,
    heightMm: i.widthMm,
    outline: outline.points,
    walls: outline.walls,
    pieces,
    marks,
    rows: traced.rows,
    guide,
    stats: {
      whole: pieces.length - pieces.filter((p) => p.cut).length,
      cut: pieces.filter((p) => p.cut).length,
      reused,
      wasteM2: mm2ToM2(lay.wasteMm * i.boardWidthMm),
    },
  };
}

/**
 * Laminate. Straight: rows across the room minus the wall gaps, each row laid by `layRows` (offcuts start the
 * next rows, joints ≥ 30 cm apart, no piece under 30 cm) — the scheme; boards bought = the larger of that plan
 * and the same rules laid row by row without look-ahead (`greedyRows`), packs = ⌈boards / per pack⌉; a last row
 * under 5 cm warns. Diagonal and herringbone: floor area + 15 % (unconfirmed). Underlay in 1 m strips, in rolls.
 */
export const laminat: ToolModule<LaminatInput> = {
  id: "laminat",
  // 2: a full offcut pool gives up its shortest piece instead of wasting a longer new one (narrow rooms).
  // 3: boards = max(optimised plan, row-by-row plan) — a fitter without the scheme in hand (who trims a start
  //    offcut to fit, re-review 2026-10-21) must still have enough; the mockup stays 85 boards / 10 packs, 2.08 ×
  //    4.436 m 39 / 5; underlay by 1 m strips (mockup 2 → 3 rolls); herringbone warns about A/B boards
  //    (formula review 2026-10-21).
  version: 3,
  input,
  defaults: () => ({
    shape: "rect",
    lengthMm: 4600,
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    cutCorner: "se",
    widthMm: 4300,
    // Placed on the example plan: door in the bottom wall, window in the left one (rows along the light).
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 3, offsetMm: 1550 }] },
    ],
    direction: "length",
    method: "straight",
    boardLengthMm: 1285,
    boardWidthMm: 192,
    boardsPerPack: 9,
    gapMm: 10,
    minOffsetMm: 300,
    wastePct: LAMINATE_WASTE_PCT.diagonal,
    underlay: true,
    underlayRollM2: 10,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const steps: Step[] = [];
    if (i.shape === "l" && !cutOf(i) && i.cutLengthMm > 0 && i.cutWidthMm > 0) {
      warnings.push({ code: "cut_too_large", level: "warning" });
    }
    const cut = cutOf(i);
    const floorM2 = mm2ToM2(i.lengthMm * i.widthMm - (cut ? cut.along * cut.across : 0));
    const boardM2 = mm2ToM2(i.boardLengthMm * i.boardWidthMm);
    const packM2 = boardM2 * i.boardsPerPack;
    const pack = { kind: "pack" as const, size: { value: packM2, unit: "m2" as const } };
    const items: PurchaseItem[] = [];
    let layout: Layout | undefined;
    const summary: ToolResult["summary"][number][] = [];

    if (i.method === "straight") {
      const along = i.direction === "length";
      const lay = straight(i, along);
      const other = straight(i, !along);
      items.push(purchase("laminate", "main", { value: lay.boards * boardM2, unit: "m2" }, pack));
      steps.push(
        {
          code: "rows",
          values: {
            across: (along ? i.widthMm : i.lengthMm) / 1000,
            gap: i.gapMm,
            board: i.boardWidthMm,
            rows: lay.rows,
            last: lay.lastRowMm,
          },
        },
        lay.greedyBoards > lay.planBoards
          ? {
              code: "boards_reserve",
              values: { plan: lay.planBoards, boards: lay.boards, perPack: i.boardsPerPack, packs: lay.packs },
            }
          : { code: "boards", values: { boards: lay.boards, perPack: i.boardsPerPack, packs: lay.packs } },
      );
      if (lay.lastRowMm < MIN_LAST_ROW_MM) {
        warnings.push({
          code: "narrow_last_row",
          level: "warning",
          values: { last: lay.lastRowMm / 10, trim: (lay.lastRowMm + i.boardWidthMm) / 20 },
        });
      }
      if (lay.relaxed)
        warnings.push({ code: "offset_impossible", level: "warning", values: { offset: i.minOffsetMm / 10 } });
      if (other.packs < lay.packs) {
        warnings.push({ code: "other_direction_cheaper", level: "info", values: { packs: other.packs } });
      }
      layout = scheme(i, lay, along, warnings);
      summary.push(
        { key: "rows", value: lay.rows, unit: "pcs" },
        { key: "boards", value: lay.boards, unit: "pcs" },
        ...(lay.boards > lay.planBoards
          ? [{ key: "spareBoards", value: lay.boards - lay.planBoards, unit: "pcs" as const }]
          : []),
        { key: "lastRow", value: lay.lastRowMm, unit: "mm" },
      );
    } else {
      const wastePct = i.wastePct;
      const need = coverage({ areaM2: floorM2, ratePerM2: 1, wastePct });
      items.push(purchase("laminate", "main", { value: need, unit: "m2" }, pack));
      warnings.push({ code: "waste_unconfirmed", level: "info", values: { pct: wastePct } });
      // Herringbone is laid from left and right boards (A and B locks); ordinary planks do not make it.
      if (i.method === "herringbone") warnings.push({ code: "herringbone_ab", level: "warning" });
      steps.push({ code: "waste", values: { area: floorM2, pct: wastePct, need } });
    }
    steps.push({ code: "packs", values: { pack: packM2, packs: (items[0] as PurchaseItem).packs } });
    summary.push({ key: "floorArea", value: floorM2, unit: "m2" });

    if (i.underlay) {
      const byArea = purchase(
        "underlay",
        "related",
        { value: floorM2, unit: "m2" },
        {
          kind: "roll",
          size: { value: i.underlayRollM2, unit: "m2" },
        },
      );
      const strips = underlayRolls(i, i.underlayRollM2);
      const rolls = Math.max(byArea.packs, strips.rolls);
      const bought = rolls * i.underlayRollM2;
      const underlay: PurchaseItem = {
        ...byArea,
        packs: rolls,
        bought: { value: bought, unit: "m2" },
        leftover: { value: Math.max(bought - floorM2, 0), unit: "m2" },
      };
      items.push(underlay);
      steps.push({
        code: "underlay",
        values: {
          area: floorM2,
          strips: strips.strips,
          width: UNDERLAY_ROLL_WIDTH_MM / 1000,
          length: (strips.alongLength ? i.lengthMm : i.widthMm) / 1000,
          roll: i.underlayRollM2,
          rolls,
        },
      });
    }
    return layout ? { items, summary, warnings, steps, layout } : { items, summary, warnings, steps };
  },
};
