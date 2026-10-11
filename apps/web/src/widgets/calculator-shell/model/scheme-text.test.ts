import { toolModules } from "@umnyaut/calc";
import { getTool } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { guideLines, rowLines, runLines, sheetLines } from "./scheme-text";

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

  it("a sheet says how much to cut and how wide it lies", () => {
    expect(
      sheetLines([
        { lengthMm: 4300, floorWidthMm: 2475, short: false },
        { lengthMm: 2800, floorWidthMm: 1210, short: true },
      ]),
    ).toEqual([
      { title: "Полотно 1 · отрез 4,3 м", parts: ["на полу 2,48 м по ширине"] },
      { title: "Полотно 2 · отрез 2,8 м", parts: ["на полу 1,21 м по ширине", "короткое — в узкой части комнаты"] },
    ]);
  });

  it("every linoleum guide code of the example has Russian text", () => {
    const linoleum = getTool("pol", "linoleum");
    const layout = toolModules.linoleum.compute(toolModules.linoleum.defaults(ctx) as never, ctx).layout;
    if (!linoleum || !layout) throw new Error("no linoleum layout");
    const lines = guideLines(linoleum, layout);
    expect(lines[0]).toBe("Раскатайте полотно 1 вдоль стены 4 от угла «Старт», следующие — рядом, рулон 2,5 м");
    expect(lines.every((l) => !/\{|\}|_/.test(l))).toBe(true);
  });

  it("a plinth run says which plank each piece comes from and where the rest goes", () => {
    expect(
      runLines([
        {
          wall: 1,
          lengthMm: 4300,
          pieces: [
            { lengthMm: 400, plank: 2, from: "rest" },
            { lengthMm: 2500, plank: 3, from: "whole" },
            { lengthMm: 1400, plank: 4, from: "cut" },
          ],
          carryMm: 1100,
        },
        { wall: 2, lengthMm: 600, pieces: [{ lengthMm: 600, plank: 4, from: "rest" }], carryMm: 500 },
      ]),
    ).toEqual([
      {
        title: "Участок 1 · стена 2 · 4,3 м",
        parts: [
          "остаток планки 2 — 0,4 м",
          "планка 3 целиком",
          "планка 4: отрезать 1,4 м",
          "остаток 1,1 м → участок 2",
        ],
      },
      { title: "Участок 2 · стена 3 · 0,6 м", parts: ["остаток планки 4 — 0,6 м", "остаток 0,5 м — в запас"] },
    ]);
  });

  it("every plinth guide code of the example has Russian text", () => {
    const plintus = getTool("pol", "plintus");
    const layout = toolModules.plintus.compute(toolModules.plintus.defaults(ctx) as never, ctx).layout;
    if (!plintus || !layout) throw new Error("no plinth layout");
    const lines = guideLines(plintus, layout);
    expect(lines[0]).toBe("Начните с самого длинного участка — стены 1 от угла «Старт» — и идите по часовой стрелке");
    expect(lines.every((l) => !/\{|\}|_/.test(l))).toBe(true);
  });

  it("every tile guide code of the example has Russian text", () => {
    const plitka = getTool("plitka", "plitka");
    const layout = toolModules.plitka.compute(toolModules.plitka.defaults(ctx) as never, ctx).layout;
    if (!plitka || !layout) throw new Error("no tile layout");
    const lines = guideLines(plitka, layout);
    expect(lines[0]).toBe(
      "Начните от угла «Старт»: у стен 3 и 4 лягут целые плитки, подрезка уйдёт к противоположным стенам",
    );
    expect(lines).toContain("У стены 2 крайний ряд подрезается до 5,5 см");
    expect(lines.every((l) => !/\{|\}|_/.test(l))).toBe(true);
  });
});
