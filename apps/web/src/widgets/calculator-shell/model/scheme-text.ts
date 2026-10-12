import type { Layout, LayoutElevation, LayoutRoll, LayoutRow, LayoutRun, LayoutSheet } from "@umnyaut/calc";
import { schemeStrings, type ToolDef, toolGuides } from "@umnyaut/catalog";
import { formatNumber } from "@umnyaut/ui/format";
import { fill } from "@/shared/lib";

const s = schemeStrings;
const cm = (mm: number) => formatNumber(mm / 10, { maxFraction: 1 });
const m = (mm: number) => formatNumber(mm / 1000, { maxFraction: 2 });

/** Laying steps in Russian from the guide codes (catalog `toolGuides`). */
export function guideLines(tool: ToolDef, layout: Layout): string[] {
  return layout.guide.map((step) =>
    fill(
      toolGuides[tool.id]?.[step.code] ?? step.code,
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
    const columns = e.cutColumns ?? [];
    const rows = e.cutRows ?? [];
    if (columns.length > 0) parts.push(fill(columns.length > 1 ? w.cutCorners : w.cutCorner, { cuts: list(columns) }));
    if (rows.length > 0) parts.push(fill(rows.length > 1 ? w.cutRows : w.cutRow, { cuts: list(rows) }));
    if ((e.aroundOpenings ?? 0) > 0) parts.push(fill(w.around, { count: e.aroundOpenings ?? 0 }));
    return { title: fill(w.wall, { n: e.wall + 1, length: m(e.lengthMm) }), parts };
  });
}

/**
 * Wallpaper, one line per wall for «Что клеить по стенам», left to right: «Стена 1 · 4,6 м: старт — линия уровня
 * в 20 см от левого угла · от угла — остаток полосы 18, 20 см · полосы 1–8 · в углу — полоса 9, 16 см на этой
 * стене · линии уровня: 20 см от угла».
 */
export function hangLines(layout: Layout): { title: string; parts: string[] }[] {
  const t = s.strips.walls;
  return (layout.elevations ?? []).flatMap((e) => {
    const st = e.strips;
    if (!st) return [];
    const parts: string[] = [];
    if (layout.start?.wall === e.wall) parts.push(fill(t.startHere, { line: cm(layout.start.lineMm) }));
    let run: number[] = [];
    const flush = () => {
      const first = run[0];
      if (first !== undefined)
        parts.push(run.length === 1 ? fill(t.strip, { first }) : fill(t.strips, { first, last: run.at(-1) ?? first }));
      run = [];
    };
    for (const c of st.columns) {
      const prev = run.at(-1);
      if (c.kind === "full" && (prev === undefined || Math.abs(c.n - prev) === 1)) {
        run.push(c.n);
        continue;
      }
      flush();
      if (c.kind === "full") run.push(c.n);
      else if (c.kind === "carry") parts.push(fill(t.carry, { n: c.n, width: cm(c.widthMm) }));
      else if (c.kind === "corner") parts.push(fill(t.corner, { n: c.n, width: cm(c.widthMm) }));
      else if (c.kind === "closing") parts.push(fill(t.closingStrip, { n: c.n, width: cm(c.widthMm) }));
      else if (c.kind === "edge") parts.push(fill(t.edgeStrip, { n: c.n, width: cm(c.widthMm) }));
      else {
        const list = st.pieces
          .filter((p) => p.n === c.n)
          .map((p) => fill(p.where === "above" ? t.above : t.below, { length: m(p.lengthMm) }))
          .join(", ");
        parts.push(fill(t.pieces, { n: c.n, list }));
      }
    }
    flush();
    if (st.linesMm.length > 0) parts.push(fill(t.lines, { list: st.linesMm.map(cm).join(", ") }));
    return [{ title: fill(s.grid.walls.wall, { n: e.wall + 1, length: m(e.lengthMm) }), parts }];
  });
}

/**
 * The wallpaper cutting map, one line per roll: what to cut in order, what is cut from a rest, the rests left and
 * the waste: «Рулон 1: полоса 1 — 2,8 м · … · кусок К1 под окном — 1 м (из остатка) · остаётся: 0,15 × 0,53 м».
 */
export function rollLines(rolls: readonly LayoutRoll[], rollWidthMm: number): { title: string; parts: string[] }[] {
  const t = s.strips.walls;
  const area = (v: number) => formatNumber(v, { maxFraction: 2 });
  return rolls.map((roll, k) => {
    const parts = roll.cuts.map((c) => {
      const length = m(c.lengthMm);
      let text: string;
      if (c.piece !== undefined)
        text = fill(t.rollPiece, { n: c.piece, where: c.where === "below" ? t.whereBelow : t.whereAbove, length });
      else if (c.also !== undefined)
        text = fill(t.rollPair, {
          n: c.strip ?? 0,
          also: c.also,
          length,
          a: cm(c.parts?.[0]?.widthMm ?? 0),
          b: cm(c.parts?.at(-1)?.widthMm ?? 0),
        });
      else if (c.widthMm < rollWidthMm - 1 && (c.parts?.length ?? 0) <= 1)
        text = fill(t.rollNarrow, { n: c.strip ?? 0, length, width: cm(c.widthMm) });
      else text = fill(t.rollStrip, { n: c.strip ?? 0, length });
      return c.fromCutout ? `${text} (${t.fromCutout})` : c.fromRest ? `${text} (${t.fromRest})` : text;
    });
    parts.push(
      roll.rests.length > 0
        ? fill(t.rests, {
            list: roll.rests.map((r) => fill(t.rest, { length: m(r.lengthMm), width: m(r.widthMm) })).join(", "),
          })
        : t.noRests,
    );
    if (roll.wasteM2 > 0.005) parts.push(fill(t.waste, { area: area(roll.wasteM2) }));
    return { title: fill(t.roll, { n: k + 1 }), parts };
  });
}
