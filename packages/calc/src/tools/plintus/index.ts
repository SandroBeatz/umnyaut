import * as z from "zod/mini";
import {
  cutCornerSchema,
  fromLongest,
  MIN_PLINTH_PIECE_MM,
  mmToM,
  openingInputSchema,
  type PlacedOpening,
  placeOpenings,
  planRuns,
  purchase,
  type RunsPlan,
  roomOutline,
  runsLayout,
} from "../../blocks";
import type { Layout, PlanWall, PurchaseItem, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.int().check(z.minimum(300), z.maximum(100_000));

/** Shared with every tool, so the plan places of openings survive between tools. */
const opening = openingInputSchema;

const input = z.object({
  shape: z.enum(["rect", "l"]),
  lengthMm: length,
  widthMm: length,
  cutLengthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  cutWidthMm: z.int().check(z.minimum(0), z.maximum(100_000)),
  /** Where the cut-out sits on the plan (scheme only). */
  cutCorner: cutCornerSchema,
  openings: z.readonly(z.array(opening).check(z.maxLength(20))),
  /** Norm `plinth.length`. */
  plankLengthMm: z.int().check(z.minimum(1000), z.maximum(6000)),
  /** Screw-and-dowel mounting; off for glue or tape. */
  fasteners: z.boolean(),
  /** Norm `plinth.fastenerSpacing` (Arbiton INDO manual: max 30–40 cm). */
  fastenerSpacingMm: z.int().check(z.minimum(100), z.maximum(1000)),
});

export type PlintusInput = z.infer<typeof input>;

/**
 * Straight plinth runs before the doors are placed: the walls (6 for an L-shape), each door put on the longest
 * run left and splitting it in two (a door mid-wall — the conservative case for fixings and offcuts).
 */
function runs(i: PlintusInput, l: boolean): number[] {
  const walls = l
    ? [i.lengthMm, i.widthMm, i.lengthMm - i.cutLengthMm, i.cutWidthMm, i.cutLengthMm, i.widthMm - i.cutWidthMm]
    : [i.lengthMm, i.widthMm, i.lengthMm, i.widthMm];
  const pieces = [...walls];
  const doors = i.openings
    .filter((o) => o.type === "door" && o.count > 0)
    .flatMap((o) => Array.from({ length: o.count }, () => o.widthMm))
    .sort((a, b) => b - a);
  for (const door of doors) {
    const k = pieces.reduce((best, p, j) => (p > (pieces[best] as number) ? j : best), 0);
    const rest = Math.max((pieces[k] as number) - door, 0) / 2;
    pieces.splice(k, 1, rest, rest);
  }
  return pieces.filter((p) => p > 0);
}

/** A corner (the end of wall k) is outer when the clockwise outline turns left there (y down). */
function isOuter(walls: readonly PlanWall[], k: number): boolean {
  const a = walls[k] as PlanWall;
  const b = walls[(k + 1) % walls.length] as PlanWall;
  return Math.sign(a.x2 - a.x1) * Math.sign(b.y2 - b.y1) - Math.sign(a.y2 - a.y1) * Math.sign(b.x2 - b.x1) < 0;
}

/**
 * Scheme and laying guide: planks along the outline from the very plan the purchase counted. Needs every door
 * placed on the plan — an unplaced door has no wall to split, so the plan is drawn without planks until then.
 */
function scheme(
  i: PlintusInput,
  outline: ReturnType<typeof roomOutline>,
  placed: readonly PlacedOpening[],
  laid: ReturnType<typeof runsLayout> | undefined,
  overlap: boolean,
  corners: { inner: number; outer: number },
  caps: number,
): Layout {
  const doors = i.openings.filter((o) => o.type === "door").reduce((n, o) => n + o.count, 0);
  const outlineOnly: Layout = {
    kind: "outline",
    widthMm: i.lengthMm,
    heightMm: i.widthMm,
    outline: outline.points,
    walls: outline.walls,
    pieces: [],
    marks: placed.map((p) => p.mark),
    guide: [{ code: "place_doors", values: { doors } }],
    stats: { whole: 0, cut: 0, reused: 0, wasteM2: 0 },
  };
  // All doors placed but the runs do not add up: two doors overlap on the plan.
  if (overlap) return { ...outlineOnly, guide: [{ code: "doors_overlap", values: {} }] };
  if (!laid) return outlineOnly;

  const joints = laid.joints.length;
  const guide: Step[] = [
    { code: "start", values: { wall: laid.startWall + 1 } },
    { code: "carry", values: { min: MIN_PLINTH_PIECE_MM / 10 } },
    { code: corners.outer > 0 ? "corners_outer" : "corners", values: corners },
  ];
  if (caps > 0) guide.push({ code: "caps", values: { caps } });
  if (joints > 0) guide.push({ code: "joints", values: {} });
  if (i.fasteners) guide.push({ code: "fasteners", values: { spacing: i.fastenerSpacingMm / 10 } });
  const cut = laid.pieces.filter((p) => p.cut).length;
  return {
    ...outlineOnly,
    pieces: laid.pieces,
    marks: [laid.start, ...laid.joints, ...placed.map((p) => p.mark)],
    runs: laid.runs,
    guide,
    stats: {
      whole: laid.pieces.length - cut,
      cut,
      reused: laid.pieces.filter((p) => p.reused).length,
      wasteM2: 0,
    },
  };
}

const piece = (key: string, count: number): PurchaseItem =>
  purchase(key, "related", { value: count, unit: "pcs" }, { kind: "piece", size: { value: 1, unit: "pcs" } });

/**
 * Plinth: run = perimeter − door widths (an L-shape keeps the rectangle's perimeter). Planks come from a cut
 * plan (`planRuns`): the runs laid as one ribbon from the longest, offcuts carried on, no piece shorter than
 * 30 cm cut into a run; one more plank when less than 30 cm is left for a mis-cut. With every door placed the
 * plan follows the real runs; before that each door splits the longest run. Joiners = joints in the middle of a
 * run. Corners 4 for a rectangle, 5 inner + 1 outer for an L-shape, less those a placed door takes; two caps
 * per door.
 */
export const plintus: ToolModule<PlintusInput> = {
  id: "plintus",
  // 2: a cut plan with a 30 cm minimum piece and a spare plank when less than 30 cm is left, joiners = real
  //    mid-run joints, corners taken by a placed door dropped, a door checked against its own wall (formula
  //    review 2026-10-21, P16.7a).
  version: 2,
  input,
  defaults: () => ({
    shape: "rect",
    lengthMm: 4600,
    widthMm: 4300,
    cutLengthMm: 1500,
    cutWidthMm: 1200,
    cutCorner: "se",
    // The example plan of every floor tool: door in the bottom wall, window in the left one.
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 3, offsetMm: 1550 }] },
    ],
    plankLengthMm: 2500,
    fasteners: true,
    fastenerSpacingMm: 400,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    let l = i.shape === "l" && i.cutLengthMm > 0 && i.cutWidthMm > 0;
    if (l && (i.cutLengthMm >= i.lengthMm || i.cutWidthMm >= i.widthMm)) {
      warnings.push({ code: "cut_too_large", level: "warning" });
      l = false;
    }
    const perimeterMm = 2 * (i.lengthMm + i.widthMm);
    const doors = i.openings.filter((o) => o.type === "door" && o.count > 0);
    const doorCount = doors.reduce((n, o) => n + o.count, 0);
    const doorsMm = doors.reduce((sum, o) => sum + o.widthMm * o.count, 0);

    const outline = roomOutline(
      i.lengthMm,
      i.widthMm,
      l ? { lengthMm: i.cutLengthMm, widthMm: i.cutWidthMm } : undefined,
      i.cutCorner,
    );
    const { placed, off } = placeOpenings(outline.walls, i.openings);
    // A placed door against its own wall, an unplaced one against the longest wall.
    const longestWallMm = Math.max(...outline.walls.map((w) => w.lengthMm));
    let wideOnWall = 0;
    let wideWallMm: number | undefined;
    for (const o of doors) {
      const places = (o.places ?? []).slice(0, o.count);
      for (const place of places) {
        const wall = outline.walls[place.wall];
        if (wall && o.widthMm > wall.lengthMm) {
          wideOnWall++;
          wideWallMm ??= wall.lengthMm;
        }
      }
      if (places.length < o.count && o.widthMm > longestWallMm) wideWallMm ??= longestWallMm;
    }
    if (wideWallMm !== undefined)
      warnings.push({ code: "door_wider_than_wall", level: "warning", values: { wall: mmToM(wideWallMm) } });
    if (off - wideOnWall > 0)
      warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off - wideOnWall } });

    const steps: Step[] = [
      {
        code: "perimeter",
        values: { length: mmToM(i.lengthMm), width: mmToM(i.widthMm), perimeter: mmToM(perimeterMm) },
      },
    ];
    const runMm = perimeterMm - doorsMm;
    if (runMm <= 0) {
      warnings.push({ code: "doors_exceed_perimeter", level: "warning" });
      return { items: [], summary: [], warnings, steps };
    }
    if (doorsMm > 0) {
      steps.push({ code: "run", values: { perimeter: mmToM(perimeterMm), doors: mmToM(doorsMm), run: mmToM(runMm) } });
    }

    // Every door placed and the runs add up to the counted length: the plan follows the real runs.
    const placedDoors = placed.filter((p) => p.type === "door").length;
    const size = Math.max(i.lengthMm, i.widthMm);
    const layoutRuns =
      placedDoors === doorCount
        ? runsLayout({ walls: outline.walls, placed, plankLengthMm: i.plankLengthMm, thicknessMm: size * 0.025 })
        : undefined;
    const total = layoutRuns?.runs.reduce((sum, r) => sum + r.lengthMm, 0) ?? 0;
    const laid = layoutRuns && Math.abs(total - runMm) < 1 ? layoutRuns : undefined;
    const overlap = layoutRuns !== undefined && !laid && off === 0;
    const plan: RunsPlan =
      laid?.plan ??
      planRuns(
        fromLongest(runs(i, l), (r) => r),
        i.plankLengthMm,
      );

    // Less than a minimum piece left: one more plank, so a mis-cut does not stop the work.
    const spare = plan.leftoverMm < MIN_PLINTH_PIECE_MM ? 1 : 0;
    const packs = plan.planks + spare;
    const bought = mmToM(packs * i.plankLengthMm);
    const need = mmToM(runMm);
    const plinth: PurchaseItem = {
      ...purchase(
        "plinth",
        "main",
        { value: need, unit: "m" },
        { kind: "plank", size: { value: mmToM(i.plankLengthMm), unit: "m" } },
      ),
      packs,
      bought: { value: bought, unit: "m" },
      leftover: { value: Math.max(bought - need, 0), unit: "m" },
    };

    let innerCorners = l ? 5 : 4;
    let outerCorners = l ? 1 : 0;
    if (laid) {
      outerCorners = laid.corners.filter((k) => isOuter(outline.walls, k)).length;
      innerCorners = laid.corners.length - outerCorners;
    }
    const caps = 2 * doorCount;
    const joiners = plan.joints;
    const items = [
      plinth,
      ...(innerCorners > 0 ? [piece("plinth-corner-in", innerCorners)] : []),
      ...(outerCorners > 0 ? [piece("plinth-corner-out", outerCorners)] : []),
      ...(caps > 0 ? [piece("plinth-cap", caps)] : []),
      ...(joiners > 0 ? [piece("plinth-joiner", joiners)] : []),
    ];
    if (i.fasteners) {
      // A fixing near both ends of every straight run, and no more than the spacing between them.
      const fasteners = runs(i, l).reduce((n, run) => n + Math.ceil(run / i.fastenerSpacingMm) + 1, 0);
      items.push(piece("plinth-fastener", fasteners));
      steps.push({
        code: "fasteners",
        values: { run: mmToM(runMm), spacing: mmToM(i.fastenerSpacingMm), count: fasteners },
      });
    }
    const byLength = Math.ceil(runMm / i.plankLengthMm - 1e-9);
    steps.push({ code: "planks", values: { run: mmToM(runMm), plank: mmToM(i.plankLengthMm), planks: byLength } });
    if (plan.planks > byLength)
      steps.push({ code: "planks_plan", values: { min: MIN_PLINTH_PIECE_MM / 10, planks: plan.planks } });
    if (spare > 0)
      steps.push({
        code: "planks_spare",
        values: { left: mmToM(plan.leftoverMm), min: MIN_PLINTH_PIECE_MM / 10, planks: packs },
      });
    steps.push({ code: "corners", values: { inner: innerCorners, outer: outerCorners } });
    if (laid && laid.corners.length < outline.walls.length)
      steps.push({ code: "corners_doors", values: { doors: outline.walls.length - laid.corners.length } });
    if (caps > 0) steps.push({ code: "caps", values: { doors: doorCount, caps } });
    if (joiners > 0) steps.push({ code: "joiners", values: { joiners } });

    const layout = scheme(i, outline, placed, laid, overlap, { inner: innerCorners, outer: outerCorners }, caps);

    return {
      items,
      layout,
      summary: [
        { key: "run", value: mmToM(runMm), unit: "m" },
        { key: "perimeter", value: mmToM(perimeterMm), unit: "m" },
      ],
      warnings,
      steps,
    };
  },
};
