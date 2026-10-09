import { z } from "zod";
import { cutStrips, mmToM, purchase, wallAreaM2 } from "../../blocks";
import type { PurchaseItem, Room, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.number().int().min(300).max(100_000);

const opening = z.object({
  type: z.enum(["door", "window"]),
  widthMm: z.number().int().min(100).max(10_000),
  heightMm: z.number().int().min(100).max(10_000),
  count: z.number().int().min(0).max(50),
});

const input = z.object({
  lengthMm: length,
  widthMm: length,
  heightMm: z.number().int().min(1000).max(10_000),
  openings: z.array(opening).max(20).readonly(),
  rollWidthMm: z.number().int().min(300).max(1500),
  rollLengthMm: z.number().int().min(5000).max(50_000),
  /** Pattern repeat (раппорт); 0 = plain or free match. */
  repeatMm: z.number().int().min(0).max(1500),
  match: z.enum(["straight", "offset"]),
  /** Trim allowance per strip, top and bottom together (norm `wallpaper.trimAllowance`). */
  trimMm: z.number().int().min(0).max(300),
  /** Wall area one pack of paste covers, from the pack (norm `wallpaperPaste.coverage`). */
  pasteCoverageM2: z.number().min(1).max(200),
});

export type OboiInput = z.infer<typeof input>;

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

/**
 * Wallpaper by strips, not by area. Full-height strips cover the perimeter minus, per opening, the width a
 * whole strip can be left out of (width − roll width); each strip is height + trim, aligned to the pattern
 * repeat with the worst-case start of every roll. Pieces above doors and above/below windows are cut from roll
 * tails first (the above and below pieces of a window as one cut). Rolls come from `cutStrips`; paste by net
 * wall area and the pack's coverage. L-shaped rooms share the rectangle's perimeter.
 */
export const oboi: ToolModule<OboiInput> = {
  id: "oboi",
  version: 1,
  input,
  defaults: () => ({
    lengthMm: 4600,
    widthMm: 4300,
    heightMm: 2700,
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
    ],
    rollWidthMm: 530,
    rollLengthMm: 10_050,
    repeatMm: 0,
    match: "straight",
    trimMm: 100,
    pasteCoverageM2: 30,
  }),
  compute(i): ToolResult {
    const warnings: Warning[] = [];
    const openings = i.openings.filter((o) => o.count > 0);
    const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
    const walls = wallAreaM2(room);
    const perimeterMm = 2 * (i.lengthMm + i.widthMm);
    const openingsWidthMm = openings.reduce((sum, o) => sum + savedWidthMm(o, i.rollWidthMm) * o.count, 0);
    const coveredMm = Math.max(perimeterMm - openingsWidthMm, 0);
    const strips = Math.ceil(coveredMm / i.rollWidthMm);
    const stripMm = i.heightMm + i.trimMm;
    const alignedMm = i.repeatMm > 0 ? Math.ceil(stripMm / i.repeatMm) * i.repeatMm : stripMm;
    const pieces = openingPieces(i, openings);

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
    steps.push({
      code: "strips",
      values: {
        perimeter: mmToM(perimeterMm),
        openings: mmToM(openingsWidthMm),
        width: mmToM(i.rollWidthMm),
        strips,
      },
    });
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
      // Strips that use the roll almost to the end: a roll shorter within the tolerance gives one strip less.
      const lead = i.repeatMm > 0 ? i.repeatMm - 1 : 0;
      const slackMm = i.rollLengthMm - lead - cut.perRoll * alignedMm + (alignedMm - stripMm);
      if (cut.perRoll > 0 && slackMm < ROLL_TOLERANCE * i.rollLengthMm) {
        warnings.push({ code: "roll_tight", level: "info", values: { slack: mmToM(Math.max(slackMm, 0)) } });
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
    };
  },
};
