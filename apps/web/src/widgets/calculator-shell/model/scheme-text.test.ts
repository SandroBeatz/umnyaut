import { toolModules } from "@umnyaut/calc";
import { getTool } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { guideLines, rowLines } from "./scheme-text";

describe("layout scheme texts", () => {
  const tool = getTool("pol", "laminat");
  const module = toolModules.laminat;
  const ctx = { country: "RU" } as const;
  const layout = module.compute(module.defaults(ctx) as never, ctx).layout;

  it("every guide code of the example has Russian text with its numbers", () => {
    if (!tool || !layout) throw new Error("no laminate layout");
    const lines = guideLines(tool, layout);
    expect(lines[0]).toBe("Начните от стены 1 в углу «Старт»: первый ряд — гребнем к стене, по периметру клинья 10 мм");
    expect(lines.every((l) => !/\{|\}|_/.test(l))).toBe(true);
  });

  it("a row says what to cut and where the rest goes", () => {
    const lines = rowLines([
      {
        lengthMm: 4580,
        widthMm: 192,
        start: 1285,
        startFrom: "whole",
        whole: 2,
        end: 725,
        endFrom: "new",
        rest: 560,
        restToRow: 1,
      },
      {
        lengthMm: 4580,
        widthMm: 192,
        start: 560,
        startFrom: "pool",
        startFromRow: 0,
        whole: 3,
        end: 165,
        endFrom: "new",
        rest: 1120,
      },
    ]);
    expect(lines[0]?.title).toBe("Ряд 1 · ширина 19,2 см");
    expect(lines[0]?.parts).toEqual([
      "начать с целой доски",
      "целых досок: 2",
      "закончить куском 72,5 см от новой доски",
      "остаток 56 см → ряд 2",
    ]);
    expect(lines[1]?.parts[0]).toBe("начать с обрезка 56 см из ряда 1");
    expect(lines[1]?.parts.at(-1)).toBe("остаток 112 см — в отходы");
  });
});
