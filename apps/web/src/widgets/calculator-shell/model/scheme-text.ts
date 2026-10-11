import type { Layout, LayoutRow } from "@umnyaut/calc";
import { shell, type ToolDef } from "@umnyaut/catalog";
import { formatNumber } from "@umnyaut/ui/format";
import { fill } from "@/shared/lib";

const s = shell.scheme;
const cm = (mm: number) => formatNumber(mm / 10, { maxFraction: 1 });

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
