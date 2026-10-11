import * as z from "zod/mini";
import {
  cutCornerSchema,
  mmToM,
  openingInputSchema,
  placeOpenings,
  purchase,
  roomOutline,
  runsLayout,
} from "../../blocks";
import type { Layout, PurchaseItem, Step, ToolModule, ToolResult, Warning } from "../../types";

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
 * Straight plinth runs: the walls (6 for an L-shape), each door put on the longest run left and splitting it
 * in two (a door mid-wall — the conservative case for fixings).
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

/**
 * Scheme and laying guide: planks along the outline from the very count the purchase made. Needs every door
 * placed on the plan — an unplaced door has no wall to split, so the plan is drawn without planks until then.
 */
function scheme(
  i: PlintusInput,
  l: boolean,
  runMm: number,
  planks: number,
  corners: { inner: number; outer: number },
  caps: number,
  warnings: Warning[],
): Layout {
  const outline = roomOutline(
    i.lengthMm,
    i.widthMm,
    l ? { lengthMm: i.cutLengthMm, widthMm: i.cutWidthMm } : undefined,
    i.cutCorner,
  );
  const { placed, off } = placeOpenings(outline.walls, i.openings);
  if (off > 0) warnings.push({ code: "opening_off_wall", level: "warning", values: { count: off } });
  const doors = i.openings.filter((o) => o.type === "door").reduce((n, o) => n + o.count, 0);
  const placedDoors = placed.filter((p) => p.type === "door");
  const size = Math.max(i.lengthMm, i.widthMm);
  const laid = runsLayout({
    walls: outline.walls,
    placed,
    plankLengthMm: i.plankLengthMm,
    thicknessMm: size * 0.025,
  });
  const total = laid.runs.reduce((sum, r) => sum + r.lengthMm, 0);
  // Every door placed and the runs add up to the purchased length: then the planks are the planks bought.
  const ready = placedDoors.length === doors && Math.abs(total - runMm) < 1 && laid.planks === planks;
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
  if (!ready && placedDoors.length === doors && off === 0)
    return { ...outlineOnly, guide: [{ code: "doors_overlap", values: {} }] };
  if (!ready) return outlineOnly;

  const joints = laid.joints.length;
  const guide: Step[] = [
    { code: "start", values: { wall: laid.startWall + 1 } },
    { code: "carry", values: {} },
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
 * Plinth: run = perimeter − door widths (an L-shape keeps the rectangle's perimeter); planks = ⌈run / plank⌉,
 * offcuts are joined with connectors, so joiners = planks − 1 (one per joint when laid around the room).
 * Inner corners 4 for a rectangle, 5 + 1 outer for an L-shape; two end caps per door.
 */
export const plintus: ToolModule<PlintusInput> = {
  id: "plintus",
  version: 1,
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
    const longestWallMm = Math.max(i.lengthMm, i.widthMm);
    if (doors.some((o) => o.widthMm > longestWallMm)) {
      warnings.push({ code: "door_wider_than_wall", level: "warning", values: { wall: mmToM(longestWallMm) } });
    }

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

    const plinth = purchase(
      "plinth",
      "main",
      { value: mmToM(runMm), unit: "m" },
      {
        kind: "plank",
        size: { value: mmToM(i.plankLengthMm), unit: "m" },
      },
    );
    const innerCorners = l ? 5 : 4;
    const outerCorners = l ? 1 : 0;
    const caps = 2 * doorCount;
    const joiners = Math.max(plinth.packs - 1, 0);
    const items = [
      plinth,
      piece("plinth-corner-in", innerCorners),
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
    steps.push(
      { code: "planks", values: { run: mmToM(runMm), plank: mmToM(i.plankLengthMm), planks: plinth.packs } },
      { code: "corners", values: { inner: innerCorners, outer: outerCorners } },
    );
    if (caps > 0) steps.push({ code: "caps", values: { doors: doorCount, caps } });
    if (joiners > 0) steps.push({ code: "joiners", values: { planks: plinth.packs, joiners } });

    const layout = scheme(i, l, runMm, plinth.packs, { inner: innerCorners, outer: outerCorners }, caps, warnings);

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
