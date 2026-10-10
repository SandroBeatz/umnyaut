import type { GoldenFile } from "../../golden";
import type { LaminatInput } from "./index";

const RULES =
  "Quick-Step: смещение стыков соседних рядов не меньше 30 см, кусок не короче 30 см, последний ряд не уже 5 см, https://www.quick-step.ru/laminate/installation/; Tarkett: зазор у стен 10–15 мм, https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-laminata-i-ukhod/";

/**
 * Hand derivations, row by row (the `layRows` rules). Rows = ⌈(room across − 2 × 10) / board width⌉; each row
 * is room along − 2 × 10; packs = ⌈boards / per pack⌉. Diagonal and herringbone: floor area × 1,15 / pack area.
 */
export const golden: GoldenFile<LaminatInput> = {
  tool: "laminat",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 m, board 1285 × 192, 9 per pack (defaults)",
      input: {},
      expected: {
        items: { laminate: { packs: 10 }, underlay: { packs: 2, need: 19.78 } },
        summary: { rows: 23, boards: 85, lastRow: 56 },
        warnings: ["other_direction_cheaper"],
      },
      source: {
        kind: "manual",
        ref: `${RULES}. Замок с двух концов: правая часть обрезка может только начать ряд, левая — только закончить. Ряды по 4580, первые восемь вручную: 985 (рез, левая часть 300 в запас концов) + 2 + 1025 → 4; 425 (рез, левая 860) + 3 + конец 300 из запаса → 4; 725 (рез, левая 560) + 3, без конца → 4; целая + 2 + конец 725 из 860 → 3; 300 (рез, левая 985) + 3 + конец 425 из 560 → 4; 1025 (рез) + 2 + конец 985 из запаса → 3; 725 + 3 → 4; целая + 2 + 725 → 4. Все куски ≥ 30 см, стыки соседних рядов ≥ 30 см. 23 ряда → 85 досок (раскладка проверена по правилам построчно, test/rows-plan.test.ts) / 9 → 10 пачек; поперёк — 80 досок, 9 пачек`,
      },
    },
    {
      name: "Rows along the width: one pack less",
      input: { direction: "width" },
      expected: { items: { laminate: { packs: 9 } }, summary: { rows: 24, boards: 80, lastRow: 164 }, warnings: [] },
      source: {
        kind: "manual",
        ref: `${RULES}. Ряды по 4280: 1285 + 2 × 1285 + 425 (обрезок 860); 2-й с 860, конец 850 (обрезок 435); 3-й с 435, конец 1275; цикл 4 + 3 + 3. (4600 − 20) / 192 → 24 ряда, последний 164 мм; 4 + 7 × 10 + 3 + 3 = 80 досок → 9 пачек`,
      },
    },
    {
      name: "Board 1380 × 193, 8 per pack: narrow last row",
      input: { boardLengthMm: 1380, boardWidthMm: 193, boardsPerPack: 8 },
      expected: {
        items: { laminate: { packs: 10 } },
        summary: { rows: 23, boards: 77, lastRow: 34 },
        warnings: ["narrow_last_row"],
      },
      source: {
        kind: "manual",
        ref: `${RULES}. 4280 − 22 × 193 = 34 мм < 50 — подрезать первый ряд. Ряды 4580: 1380 + 2 × 1380 + 440 (обрезок 940); 940 + 2 × 1380 + 880 (обрезок 500); 500 + 2 × 1380 + 1320; цикл 4 + 3 + 3 + … : 4 + 7 × 10 + 3 = 77 досок / 8 → 10 пачек`,
      },
    },
    {
      name: "Room 6 × 5 m",
      input: { lengthMm: 6000, widthMm: 5000 },
      expected: { items: { laminate: { packs: 14 } }, summary: { rows: 26, boards: 122 } },
      source: {
        kind: "manual",
        ref: `${RULES}. Ряды 5980: 1285 + 3 × 1285 + 840 (обрезок 445); 445 + 4 × 1285 + 395 (обрезок 890); 890 + 3 × 1285 + 1235; цикл 5 + 5 + 4. (5000 − 20) / 192 → 26 рядов; 5 + 8 × 14 + 5 = 122 доски / 9 → 14 пачек`,
      },
    },
    {
      name: "Tiny room 1.2 × 1.0 m: one piece per row",
      input: { lengthMm: 1200, widthMm: 1000 },
      expected: {
        items: { laminate: { packs: 1 } },
        summary: { rows: 6, boards: 6, lastRow: 20 },
        warnings: ["narrow_last_row"],
      },
      source: {
        kind: "manual",
        ref: "Ряд 1180 короче доски 1285 — по доске на ряд; (1000 − 20) / 192 → 6 рядов, последний 20 мм",
      },
    },
    {
      name: "Last row of 30 mm: warning",
      input: { widthMm: 4274 },
      expected: {
        items: { laminate: { packs: 10 } },
        summary: { rows: 23, lastRow: 30 },
        warnings: ["narrow_last_row"],
      },
      source: { kind: "manual", ref: `${RULES}. 4254 − 22 × 192 = 30 мм < 50; ряды те же, 85 досок → 10 пачек` },
    },
    {
      name: "Diagonal: area + 15 % «по опыту укладчиков»",
      input: { method: "diagonal" },
      expected: {
        items: { laminate: { packs: 11, need: 22.747 } },
        absentItems: [],
        warnings: ["waste_unconfirmed"],
      },
      source: {
        kind: "manual",
        ref: "19,78 × 1,15 = 22,747 м² / (9 × 1,285 × 0,192 = 2,22048) = 10,24 → 11 пачек. 15 % — решение владельца, ждёт мастера",
      },
    },
    {
      name: "Herringbone: same 15 %",
      input: { method: "herringbone" },
      expected: { items: { laminate: { packs: 11 } }, warnings: ["waste_unconfirmed"] },
      source: { kind: "manual", ref: "19,78 × 1,15 / 2,22048 → 11 пачек" },
    },
    {
      name: "Rows of 2060 mm: a cut start that pays off rows later",
      input: { lengthMm: 2080, widthMm: 4436 },
      expected: { items: { laminate: { packs: 5 } }, summary: { rows: 23, boards: 39 } },
      source: {
        kind: "manual",
        ref: `${RULES}. Ряд 2060 = 1,6 доски: по правилам замков и смещения 23 ряда укладываются из 39 досок (оптимум полного перебора рецензента; раньше пошаговый выбор брал 46). Раскладка проверена построчно (test/rows-plan.test.ts). 39 / 9 → 5 пачек`,
      },
    },
    {
      name: "Herringbone with 20 % waste",
      input: { method: "herringbone", wastePct: 20 },
      expected: { items: { laminate: { packs: 11, need: 23.736 } } },
      source: { kind: "manual", ref: "19,78 × 1,2 = 23,736 м² / 2,22048 = 10,7 → 11 пачек" },
    },
    {
      name: "L-shaped room 6 × 5 m with a 3 × 2 m cut-out: the length bound is reached",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 3000, cutWidthMm: 2000 },
      expected: {
        items: { laminate: { packs: 11 }, underlay: { packs: 3 } },
        summary: { rows: 26, boards: 98, floorArea: 24 },
      },
      source: {
        kind: "manual",
        ref: `${RULES}. 26 рядов; ряды целиком в полосе выреза (2 м) — последние 26 − ⌈(5000 − 2000 − 10) / 192⌉ = 10, длиной 6000 − 3000 − 20 = 2980; 16 рядов по 5980. Нижняя граница по длине: (16 × 5980 + 10 × 2980) / 1285 = 97,6 → 98 досок — раскладка достигает её, значит оптимальна. 98 / 9 → 11 пачек; подложка 24 м² → 3 рулона`,
      },
    },
    {
      name: "L-shaped room 3 × 2 m with a 2 × 1 m cut-out: short rows of one piece",
      input: { shape: "l", lengthMm: 3000, widthMm: 2000, cutLengthMm: 2000, cutWidthMm: 1000 },
      expected: { items: { laminate: { packs: 3 } }, summary: { rows: 11, boards: 19, floorArea: 4 } },
      source: {
        kind: "manual",
        ref: `${RULES}. 6 рядов по 2980 (как в комнате 3 × 2: 3 + 2 + 2 + 3 + 2 + 2 = 14 досок, обрезки 875 и 465 уходят в следующие ряды), 5 коротких рядов по 980 — каждый из новой доски (обрезки короче 980): 14 + 5 = 19 / 9 → 3 пачки`,
      },
    },
    {
      name: "Without underlay",
      input: { underlay: false },
      expected: { items: { laminate: { packs: 10 } }, absentItems: ["underlay"] },
      source: { kind: "manual", ref: "Подложка выключена" },
    },
    {
      name: "Underlay roll 15 m²",
      input: { underlayRollM2: 15 },
      expected: { items: { underlay: { packs: 2, need: 19.78, leftover: 10.22 } } },
      source: { kind: "manual", ref: "19,78 / 15 = 1,3 → 2 рулона, останется 10,22 м²" },
    },
    {
      name: "Room 3 × 2 m: three-row cycle 3 + 2 + 2",
      input: { lengthMm: 3000, widthMm: 2000 },
      expected: { items: { laminate: { packs: 3, need: 6.41472 } }, summary: { rows: 11, boards: 26, lastRow: 60 } },
      source: {
        kind: "manual",
        ref: `${RULES}. Ряды 2980: 1285 + 1285 + 410 (обрезок 875); 875 + 1285 + 820 (обрезок 465); 465 + 1285 + 1230; 4-й = 1-му. (2000 − 20) / 192 → 11 рядов, последний 60 мм; 3 + 3 × 7 + 2 = 26 досок / 9 → 3 пачки`,
      },
    },
    {
      name: "With pack prices: total cost",
      input: { price_laminate: 1800, price_underlay: 600 } as Partial<LaminatInput>,
      expected: { costTotal: 19200 },
      source: { kind: "manual", ref: "10 пачек × 1800 + 2 рулона × 600 = 19 200 ₽" },
    },
  ],
};
