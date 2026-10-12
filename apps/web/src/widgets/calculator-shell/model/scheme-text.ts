import type { Layout, LayoutElevation, LayoutRow, LayoutRun, LayoutSheet } from "@umnyaut/calc";
import { shell, type ToolDef } from "@umnyaut/catalog";
import { formatNumber } from "@umnyaut/ui/format";
import { fill } from "@/shared/lib";

const s = shell.scheme;
const cm = (mm: number) => formatNumber(mm / 10, { maxFraction: 1 });
const m = (mm: number) => formatNumber(mm / 1000, { maxFraction: 2 });

/** Laying steps in Russian from the guide codes (catalog `ToolDef.guide`). */
export function guideLines(tool: ToolDef, layout: Layout): string[] {
  return layout.guide.map((step) =>
    fill(
      tool.guide?.[step.code] ?? step.code,
      Object.fromEntries(Object.entries(step.values).map(([k, v]) => [k, formatNumber(v, { maxFraction: 1 })])),
    ),
  );
}

/** Where the rest of a cut board goes: a later row, the end of this row, or waste. */
const restText = (rest: number, to: number | undefined, row: number) =>
  to === undefined
    ? fill(s.restWaste, { rest: cm(rest) })
    : to === row
      ? fill(s.restSame, { rest: cm(rest) })
      : fill(s.restTo, { rest: cm(rest), row: to + 1 });

/**
 * One line per row for «Что резать по рядам»: «Ряд 3 · ширина 19,2 см: начать с обрезка 64 см из ряда 2 ·
 * целых досок: 3 · закончить куском 41 см от новой доски, остаток 88 см → ряд 4».
 */
export function rowLines(rows: readonly LayoutRow[]): { title: string; parts: string[] }[] {
  return rows.map((r, k) => {
    const parts: string[] = [];
    const onePiece = r.whole === 0 && r.end === 0 && r.start === r.lengthMm;
    if (r.startFrom === "pool") {
      parts.push(fill(s.startPool, { len: cm(r.start), row: (r.startFromRow ?? 0) + 1 }));
    } else if (onePiece && r.startFrom === "cut") {
      parts.push(fill(s.onePiece, { len: cm(r.start) }));
    } else if (r.startFrom === "cut") {
      parts.push(fill(s.startCut, { len: cm(r.start) }));
    } else {
      parts.push(s.startWhole);
    }
    if (r.startRest !== undefined) parts.push(restText(r.startRest, r.startRestToRow, k));
    if (r.whole > 0) parts.push(fill(s.wholeCount, { count: r.whole }));
    if (r.end > 0) {
      if (r.endFrom === "pool")
        parts.push(
          r.endFromRow === k
            ? fill(s.endSame, { len: cm(r.end) })
            : fill(s.endPool, { len: cm(r.end), row: (r.endFromRow ?? 0) + 1 }),
        );
      else parts.push(fill(s.endNew, { len: cm(r.end) }));
    }
    if (r.rest !== undefined) parts.push(restText(r.rest, r.restToRow, k));
    return {
      title: `${fill(s.row, { n: k + 1 })} · ${fill(s.width, { width: cm(r.widthMm) })}`,
      parts,
    };
  });
}

/** One line per sheet for «Что отрезать от рулона»: «Полотно 2: отрез 4,7 м · на полу 2,18 м по ширине». */
export function sheetLines(sheets: readonly LayoutSheet[]): { title: string; parts: string[] }[] {
  const t = s.strips;
  return sheets.map((sheet, k) => ({
    title: `${fill(t.sheet, { n: k + 1 })} · ${fill(t.cut, { length: m(sheet.lengthMm) })}`,
    parts: [fill(t.floor, { width: m(sheet.floorWidthMm) }), ...(sheet.short ? [t.short] : [])],
  }));
}

/**
 * One line per run for «Что резать по стенам»: «Участок 2 · стена 2 · 4,3 м: остаток планки 2 — 0,4 м ·
 * планка 3 целиком · планка 4: отрезать 1,4 м · остаток 1,1 м → участок 3».
 */
export function runLines(runs: readonly LayoutRun[]): { title: string; parts: string[] }[] {
  const r = s.runs;
  return runs.map((run, k) => {
    const parts = run.pieces.map((p) =>
      p.from === "whole"
        ? fill(r.whole, { plank: p.plank })
        : fill(p.from === "rest" ? r.rest : r.cut, { plank: p.plank, length: m(p.lengthMm) }),
    );
    if (run.carryMm > 0)
      parts.push(
        k < runs.length - 1
          ? fill(r.carryTo, { length: m(run.carryMm), n: k + 2 })
          : fill(r.spare, { length: m(run.carryMm) }),
      );
    return { title: fill(r.run, { n: k + 1, wall: run.wall + 1, length: m(run.lengthMm) }), parts };
  });
}

/**
 * One line per wall for «Что резать по стенам» (wall tiling): «Стена 1 · 4,6 м: целых 120 · подрезанных 24 · у
 * угла по 5,5 см · ряд под потолком 27,6 см · у дверей и окон: 16».
 */
export function elevationLines(elevations: readonly LayoutElevation[]): { title: string; parts: string[] }[] {
  const w = s.grid.walls;
  const list = (cuts: readonly number[]) => [...new Set(cuts.map(cm))].join(" и ");
  return elevations.map((e) => {
    const cut = e.pieces.filter((p) => p.cut).length;
    const parts = [fill(w.whole, { count: e.pieces.length - cut }), fill(w.cut, { count: cut })];
    if (e.cutColumns.length > 0)
      parts.push(fill(e.cutColumns.length > 1 ? w.cutCorners : w.cutCorner, { cuts: list(e.cutColumns) }));
    if (e.cutRows.length > 0) parts.push(fill(e.cutRows.length > 1 ? w.cutRows : w.cutRow, { cuts: list(e.cutRows) }));
    if (e.aroundOpenings > 0) parts.push(fill(w.around, { count: e.aroundOpenings }));
    return { title: fill(w.wall, { n: e.wall + 1, length: m(e.lengthMm) }), parts };
  });
}
