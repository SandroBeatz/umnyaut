import { z } from "zod";
import { coverage, layRows, mm2ToM2, purchase } from "../../blocks";
import type { PurchaseItem, Step, ToolModule, ToolResult, Warning } from "../../types";

const length = z.number().int().min(300).max(100_000);

const input = z.object({
  lengthMm: length,
  widthMm: length,
  /** Rows run along the room length or its width. */
  direction: z.enum(["length", "width"]),
  method: z.enum(["straight", "diagonal", "herringbone"]),
  boardLengthMm: z.number().int().min(300).max(3000),
  boardWidthMm: z.number().int().min(50).max(500),
  boardsPerPack: z.number().int().min(1).max(50),
  /** Expansion gap at each wall (norm `laminate.expansionGap`). */
  gapMm: z.number().int().min(0).max(30),
  /** Joint offset between rows and the shortest piece (norm `laminate.minOffset`). */
  minOffsetMm: z.number().int().min(100).max(1000),
  /** Diagonal and herringbone waste, % (norms `laminate.waste.*`, unconfirmed). */
  wastePct: z.number().min(0).max(40),
  underlay: z.boolean(),
  underlayRollM2: z.number().min(1).max(100),
});

export type LaminatInput = z.infer<typeof input>;

/** Norm `laminate.minLastRow`. */
const MIN_LAST_ROW_MM = 50;
/** Norms `laminate.waste.diagonal`, `laminate.waste.herringbone` (unconfirmed, owner's 15 %). */
export const LAMINATE_WASTE_PCT = { diagonal: 15, herringbone: 15 } as const;

function straight(i: LaminatInput, alongLength: boolean) {
  const along = (alongLength ? i.lengthMm : i.widthMm) - 2 * i.gapMm;
  const across = (alongLength ? i.widthMm : i.lengthMm) - 2 * i.gapMm;
  const rows = Math.max(Math.ceil(across / i.boardWidthMm), 1);
  const lastRowMm = across - (rows - 1) * i.boardWidthMm;
  const laid = layRows({
    rowLengthMm: Math.max(along, 1),
    rows,
    boardLengthMm: i.boardLengthMm,
    minPieceMm: i.minOffsetMm,
    minOffsetMm: i.minOffsetMm,
  });
  const relaxed = (laid.plan ?? []).some((r) => r.relaxed);
  return { rows, lastRowMm, boards: laid.boards, packs: Math.ceil(laid.boards / i.boardsPerPack), relaxed };
}

/**
 * Laminate. Straight: rows across the room minus the wall gaps, each row laid by `layRows` (offcuts start the
 * next rows, joints ≥ 30 cm apart, no piece under 30 cm); packs = ⌈boards / per pack⌉; a last row under 5 cm
 * warns. Diagonal and herringbone: floor area + 15 % (unconfirmed). Underlay by floor area in rolls.
 */
export const laminat: ToolModule<LaminatInput> = {
  id: "laminat",
  version: 1,
  input,
  defaults: () => ({
    lengthMm: 4600,
    widthMm: 4300,
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
    const floorM2 = mm2ToM2(i.lengthMm * i.widthMm);
    const boardM2 = mm2ToM2(i.boardLengthMm * i.boardWidthMm);
    const packM2 = boardM2 * i.boardsPerPack;
    const pack = { kind: "pack" as const, size: { value: packM2, unit: "m2" as const } };
    const items: PurchaseItem[] = [];
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
        { code: "boards", values: { boards: lay.boards, perPack: i.boardsPerPack, packs: lay.packs } },
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
      summary.push(
        { key: "rows", value: lay.rows, unit: "pcs" },
        { key: "boards", value: lay.boards, unit: "pcs" },
        { key: "lastRow", value: lay.lastRowMm, unit: "mm" },
      );
    } else {
      const wastePct = i.wastePct;
      const need = coverage({ areaM2: floorM2, ratePerM2: 1, wastePct });
      items.push(purchase("laminate", "main", { value: need, unit: "m2" }, pack));
      warnings.push({ code: "waste_unconfirmed", level: "info", values: { pct: wastePct } });
      steps.push({ code: "waste", values: { area: floorM2, pct: wastePct, need } });
    }
    steps.push({ code: "packs", values: { pack: packM2, packs: (items[0] as PurchaseItem).packs } });
    summary.push({ key: "floorArea", value: floorM2, unit: "m2" });

    if (i.underlay) {
      const underlay = purchase(
        "underlay",
        "related",
        { value: floorM2, unit: "m2" },
        {
          kind: "roll",
          size: { value: i.underlayRollM2, unit: "m2" },
        },
      );
      items.push(underlay);
      steps.push({ code: "underlay", values: { area: floorM2, roll: i.underlayRollM2, rolls: underlay.packs } });
    }
    return { items, summary, warnings, steps };
  },
};
