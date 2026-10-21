import type { GoldenFile } from "../../golden";
import type { LaminatInput } from "./index";

const RULES =
  "Quick-Step: смещение стыков соседних рядов не меньше 30 см, последний ряд не уже 5 см, https://www.quick-step.ru/laminate/installation/; Tarkett: кусок не короче 30 см, зазор у стен 10–15 мм, https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-laminata-i-ukhod/";
const REVIEW = "Formula review 2026-10-21, derived by hand";

/**
 * Hand derivations, row by row (the `layRows` rules). Rows = ⌈(room across − 2 × 10) / board width⌉; each row
 * is room along − 2 × 10; packs = ⌈boards / per pack⌉. Version 3: boards bought = the larger of the optimised
 * plan (the scheme) and the same rules laid row by row without look-ahead (first offcut that fits — trimmed from its
 * sawn end if the joint offset or the row end needs it — else a whole board, else a board cut to shift the joints,
 * first a cut whose row end an offcut at hand closes). Underlay: 1 m strips as long as the room, cut from 10 m rolls.
 * Diagonal and herringbone: floor area × 1,15 / pack area.
 */
export const golden: GoldenFile<LaminatInput> = {
  tool: "laminat",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 m, board 1285 × 192, 9 per pack (defaults)",
      input: {},
      expected: {
        items: { laminate: { packs: 10 }, underlay: { packs: 3, need: 19.78 } },
        summary: { rows: 23, boards: 85, lastRow: 56 },
        warnings: ["other_direction_cheaper"],
      },
      source: {
        kind: "manual",
        ref: `${RULES}; ${REVIEW}: оптимальный план (схема) — 85 досок. Ряд за рядом, обрезок подрезают до нужной длины (re-review 2026-10-21): 1-й ряд 1285 + 2 × 1285 + 725 (новая доска, обрезок 560) → 4; 2-й — обрезок 560 дал бы конец 165 < 30 см, его подрезают до 425: 425 + 3 × 1285 + 300 (новая доска, обрезок 985) → 4; 3-й — 985 + 2 × 1285 + 1025 (новая, остаток 260 в отход) → 3; цикл 11 досок на 3 ряда: 7 × 11 + 4 + 4 = 85 — столько же, сколько по плану, покупаем 85 → 10 пачек (модель рецензента с подрезкой — тоже 85 / 10; без подрезки обрезка было 92 → 11). Подложка полосами 1 м по 4,6 м: 5 полос, из рулона 10 м — 2 → 3 рулона (в v2 по площади 19,78 / 10 → 2). Схема: замок с двух концов: правая часть обрезка может только начать ряд, левая — только закончить. Ряды по 4580, первые восемь вручную: 985 (рез, левая часть 300 в запас концов) + 2 + 1025 → 4; 425 (рез, левая 860) + 3 + конец 300 из запаса → 4; 725 (рез, левая 560) + 3, без конца → 4; целая + 2 + конец 725 из 860 → 3; 300 (рез, левая 985) + 3 + конец 425 из 560 → 4; 1025 (рез) + 2 + конец 985 из запаса → 3; 725 + 3 → 4; целая + 2 + 725 → 4. Все куски ≥ 30 см, стыки соседних рядов ≥ 30 см. 23 ряда → 85 досок (раскладка проверена по правилам построчно, test/rows-plan.test.ts); поперёк — 80 досок и по оптимуму, и ряд за рядом, 9 пачек`,
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
      source: {
        kind: "manual",
        ref: `${RULES}. 4254 − 22 × 192 = 30 мм < 50; ряды те же: по схеме и ряд за рядом с подрезкой обрезка 85 досок → 10 пачек`,
      },
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
      name: "Herringbone: same 15 %, and a warning that it needs A/B boards (v3)",
      input: { method: "herringbone" },
      expected: { items: { laminate: { packs: 11 } }, warnings: ["waste_unconfirmed", "herringbone_ab"] },
      source: {
        kind: "manual",
        ref: `19,78 × 1,15 / 2,22048 → 11 пачек. ${REVIEW}: ёлочку собирают из досок с левым и правым замком (A и B) — обычная доска 1285 × 192 так не ляжет, предупреждаем`,
      },
    },
    {
      name: "Rows of 2060 mm: row by row with a trimmed offcut also takes 39 boards, as the plan (v3)",
      input: { lengthMm: 2080, widthMm: 4436 },
      expected: { items: { laminate: { packs: 5 } }, summary: { rows: 23, boards: 39 } },
      source: {
        kind: "manual",
        ref: `${RULES}; ${REVIEW}. Ряд 2060 = 1,6 доски: по правилам замков и смещения 23 ряда укладываются из 39 досок (оптимум полного перебора рецензента, схема; раскладка проверена построчно, test/rows-plan.test.ts). Ряд за рядом с подрезкой обрезка (re-review 2026-10-21): 1-й 1285 + 775 (новая, обрезок 510) → 2; 2-й — 510 дал бы конец 265 < 30 см, подрезают до 475: 475 + 1285 + 300 (новая, обрезок 985) → 2; 3-й 985 + 1075 (новая, остаток 210 в отход) → 1; цикл 5 досок на 3 ряда: 7 × 5 + 2 + 2 = 39 → 5 пачек, как у модели рецензента (без подрезки было 46 → 6)`,
      },
    },
    {
      name: "Room 2.88 × 1.5 m: rows of 2860 end in a 29 cm sliver — still 18 boards, 2 packs (v3)",
      input: { lengthMm: 2880, widthMm: 1500 },
      expected: { items: { laminate: { packs: 2 } }, summary: { rows: 8, boards: 18 } },
      source: {
        kind: "manual",
        ref: `${RULES}; re-review 2026-10-21 (монотонность: было 3 пачки, а у 2,90 × 1,5 — 2). (1500 − 20) / 192 → 8 рядов по 2860 = 2 × 1285 + 290: с целой доски конец 29 см < 30 — первый ряд начинают с отрезка 300 (левая часть 985 в запас концов), 300 + 1285 + 1275 → 3 доски; 600 + 1285 + 975 из 985 → 2; 900 + 1285 + 675 (новая, левая часть 385) → 2; 1200 + 1285 + 375 из 385 → 2; …; 8 рядов — 18 досок. Нижняя граница по длине: 8 × 2860 / 1285 = 17,8 → 18, план оптимален. 18 / 9 → 2 пачки`,
      },
    },
    {
      name: "Room 2.90 × 1.5 m: rows of 2880 — 18 boards, 2 packs, not fewer than 2.88 m (v3)",
      input: { lengthMm: 2900, widthMm: 1500 },
      expected: { items: { laminate: { packs: 2 } }, summary: { rows: 8, boards: 18 } },
      source: {
        kind: "manual",
        ref: `${RULES}. 8 рядов по 2880: 1285 + 1285 + 310 (новая, обрезок 975) → 3; 975 + 1285 + 620 (новая, обрезок 665) → 2; 665 + 1285 + 930 (новая, обрезок 355) → 2; 355 + 1285 + 1240 (новая, остаток 45 в отход) → 2; цикл 9 досок на 4 ряда: 2 × 9 = 18 / 9 → 2 пачки; нижняя граница 8 × 2880 / 1285 = 17,9 → 18`,
      },
    },
    {
      name: "Room 1.4 × 1 m: the scheme takes 7 boards, row by row without it 8 — buy 8, 1 spare (v3)",
      input: { lengthMm: 1400, widthMm: 1000 },
      expected: { items: { laminate: { packs: 1 } }, summary: { rows: 6, boards: 8, spareBoards: 1 } },
      source: {
        kind: "manual",
        ref: `${RULES}; ${REVIEW}. (1000 − 20) / 192 → 6 рядов по 1380 = 1285 + 95: с целой доски конец 9,5 см — нельзя. Схема (перебор): 985 (рез, левая 300) + 395 (новая, обрезок 890) → 2; 685 (рез, левая 600) + 695 (новая, обрезок 590) → 2; 1080 (рез) + 300 из запаса → 1; 590 + 790 (новая, обрезок 495) → 1; 890 + 490 из 600 → 0; 495 + 885 (новая) → 1 — 7 досок. Ряд за рядом: 300 (рез, левая 985) + 1080 (новая) → 2; 600 (рез, левая 685) + 780 из 985 → 1; 900 (рез, левая 385) + 480 из 685 → 1; 600 (рез, левая 685) + 780 (новая, обрезок 505) → 2; обрезок 505 подрезан до 300 (смещение от 600) + 1080 (новая) → 1; 942 (рез, левая 343) + 438 из 685 → 1 — 8 досок. Берём 8, из них 1 — на укладку без схемы; 8 / 9 → 1 пачка`,
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
      source: {
        kind: "manual",
        ref: "19,78 / 15 = 1,3 → 2 рулона; полосами: рулон 1 × 15 м даёт 3 полосы по 4,6, 5 полос → 2 рулона; останется 10,22 м²",
      },
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
      name: "Corridor 0,47 × 5 m laid across: two pieces from every board",
      input: { lengthMm: 470, widthMm: 5000, boardLengthMm: 1292, boardWidthMm: 194, boardsPerPack: 8 },
      expected: { items: { laminate: { packs: 2 } }, summary: { rows: 26, boards: 13, lastRow: 130 } },
      source: {
        kind: "manual",
        ref: `${RULES}. Ряд 470 − 2 × 10 = 450 мм — короче доски, один кусок. (5000 − 20) / 194 → 26 рядов, последний 130 мм. С доски 1292: 450 + 450, остаток 392 короче ряда. 26 / 2 = 13 досок / 8 → 2 пачки (версия 1 давала 18 досок: остатки по 392 мм забивали запас обрезков, и длинный остаток новой доски выбрасывался)`,
      },
    },
    {
      name: "Corridor 0,47 × 20 m laid across: the offcut pool fills many times",
      input: { lengthMm: 470, widthMm: 20000, boardLengthMm: 1292, boardWidthMm: 194, boardsPerPack: 8 },
      expected: { items: { laminate: { packs: 7 } }, summary: { rows: 103, boards: 52 } },
      source: {
        kind: "manual",
        ref: `${RULES}. Ряд 450 мм, (20000 − 20) / 194 → 103 ряда. С доски 1292 — два ряда по 450, остаток 392 короче ряда. 103 / 2 → 52 доски / 8 → 7 пачек (formula-reviewer, 2026-10-11)`,
      },
    },
    {
      name: "Strip 0,32 × 5 m: four pieces from every board",
      input: { lengthMm: 320, widthMm: 5000, boardLengthMm: 1292, boardWidthMm: 194, boardsPerPack: 8 },
      expected: { items: { laminate: { packs: 1 } }, summary: { rows: 26, boards: 7 } },
      source: {
        kind: "manual",
        ref: `${RULES}. Ряд 320 − 20 = 300 мм, 26 рядов. С доски 1292 — четыре куска по 300 (1200). 26 / 4 → 7 досок → 1 пачка (formula-reviewer, 2026-10-11)`,
      },
    },
    {
      name: "With pack prices: total cost",
      input: { price_laminate: 1800, price_underlay: 600 } as Partial<LaminatInput>,
      expected: { costTotal: 19800 },
      source: { kind: "manual", ref: "10 пачек × 1800 + 3 рулона × 600 = 19 800 ₽" },
    },
    {
      name: "Underlay by strips: room 5.1 × 1.9 m — 1 roll by area, 2 by strips (v3)",
      input: { lengthMm: 5100, widthMm: 1900 },
      expected: { items: { underlay: { packs: 2, need: 9.69, leftover: 10.31 } } },
      source: {
        kind: "manual",
        ref: `${REVIEW}. По площади 9,69 / 10 → 1 рулон, но рулон 1 × 10 м: вдоль 5,1 м — 2 полосы по 5,1, из рулона одна (10 / 5,1 → 1) → 2 рулона; вдоль 1,9 м — 6 полос по 1,9, из рулона пять → 2 рулона. Покупаем 2`,
      },
    },
  ],
};
