import { z } from "zod";
import { gridArea, mm2ToM2, mmToM, purchase, wallAreaM2 } from "../../blocks";
import type { PurchaseItem, Room, Step, ToolModule, ToolResult, Warning } from "../../types";
import { klej } from "../klej";
import { zatirka } from "../zatirka";

const length = z.number().int().min(300).max(100_000);

const opening = z.object({
  type: z.enum(["door", "window"]),
  widthMm: z.number().int().min(100).max(10_000),
  heightMm: z.number().int().min(100).max(10_000),
  count: z.number().int().min(0).max(50),
});

const input = z.object({
  surface: z.enum(["floor", "walls"]),
  lengthMm: length,
  widthMm: length,
  heightMm: z.number().int().min(1000).max(10_000),
  openings: z.array(opening).max(20).readonly(),
  /** Along the room length on the floor, horizontal on walls. */
  tileLengthMm: z.number().int().min(20).max(3000),
  /** Across on the floor, vertical on walls. */
  tileWidthMm: z.number().int().min(20).max(3000),
  jointMm: z.number().min(0).max(20),
  layout: z.enum(["straight", "diagonal"]),
  start: z.enum(["corner", "center"]),
  /** Norm `tile.reserve` (straight), `tile.reserve.diagonal` replaces it for the diagonal. */
  reservePct: z.number().min(0).max(30),
  tilesPerBox: z.number().int().min(1).max(200),
  /** Related: tile adhesive and grout, counted by the adhesive and grout tools with this tile and joint. */
  adhesive: z.boolean(),
  grout: z.boolean(),
  /** Grout depth = tile thickness. */
  tileThicknessMm: z.number().min(3).max(30),
});

export type PlitkaInput = z.infer<typeof input>;

/** Norm `tile.reserve.diagonal` (Kerama Marazzi). */
export const TILE_DIAGONAL_RESERVE_PCT = 15;

/**
 * Tile by piece count (Kerama Marazzi): a grid from a corner or from the centre over the floor or each wall;
 * every cut piece takes a tile; whole tiles inside doors and windows are left out (cut tiles around them are
 * kept — safe side). Tiles × (1 + reserve), rounded up to whole tiles; boxes via `ceilPacks`. Diagonal: area /
 * tile area × 1,15. Rectangular room.
 */
export const plitka: ToolModule<PlitkaInput> = {
  id: "plitka",
  version: 1,
  input,
  defaults: () => ({
    surface: "floor",
    lengthMm: 4600,
    widthMm: 4300,
    heightMm: 2700,
    openings: [
      { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
      { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
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
    let areaM2: number;

    if (i.surface === "floor") {
      areaM2 = mm2ToM2(i.lengthMm * i.widthMm);
      if (i.layout === "straight") {
        const g = gridArea(i.lengthMm, i.widthMm, i.tileLengthMm, i.tileWidthMm, i.jointMm, i.start);
        whole = g.whole;
        cut = g.cut;
        if (g.cut > 0) narrowest = g.narrowestMm;
      }
    } else {
      const openings = i.openings.filter((o) => o.count > 0);
      const room: Room = { shape: "rect", lengthMm: i.lengthMm, widthMm: i.widthMm, heightMm: i.heightMm, openings };
      const walls = wallAreaM2(room);
      areaM2 = walls.areaM2;
      if (walls.openingsExceedWalls || !(areaM2 > 0)) {
        warnings.push({ code: "openings_exceed_walls", level: "warning" });
        return { items: [], summary: [], warnings, steps };
      }
      if (i.layout === "straight") {
        for (const wall of [i.lengthMm, i.widthMm, i.lengthMm, i.widthMm]) {
          const g = gridArea(wall, i.heightMm, i.tileLengthMm, i.tileWidthMm, i.jointMm, i.start);
          whole += g.whole;
          cut += g.cut;
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
        whole = Math.max(whole - covered, 0);
        steps.push({ code: "openings", values: { tiles: covered } });
      }
    }

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
      lengthMm: i.lengthMm,
      widthMm: i.widthMm,
      heightMm: i.heightMm,
      openings: i.openings,
      tileLengthMm: i.tileLengthMm,
      tileWidthMm: i.tileWidthMm,
    };
    if (i.adhesive) {
      const glue = klej.compute({ ...klej.defaults({ country: "RU" }), ...surface }, { country: "RU" });
      related.push(...glue.items.map((it) => ({ ...it, role: "related" as const })));
      const kg = glue.items.reduce((n, it) => n + it.need.value, 0);
      steps.push({ code: "adhesive", values: { kg, bags: glue.items.reduce((n, it) => n + it.packs, 0) } });
    }
    if (i.grout && i.jointMm > 0) {
      const fill = zatirka.compute(
        { ...zatirka.defaults({ country: "RU" }), ...surface, jointMm: i.jointMm, depthMm: i.tileThicknessMm },
        { country: "RU" },
      );
      related.push(...fill.items.map((it) => ({ ...it, role: "related" as const })));
      const kg = fill.items.reduce((n, it) => n + it.need.value, 0);
      steps.push({ code: "grout", values: { kg, packs: fill.items.reduce((n, it) => n + it.packs, 0) } });
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
      warnings,
      steps,
    };
  },
};
