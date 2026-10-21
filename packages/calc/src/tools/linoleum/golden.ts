import type { GoldenFile } from "../../golden";
import type { LinoleumInput } from "./index";

const TARKETT =
  "Tarkett: замер по наибольшей длине и ширине, «избегайте швов, выбирая максимальную ширину рулона», нахлёст полотен 3–5 см для подгонки рисунка, https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-linoleuma-i-ukhod/";

const REVIEW = "Formula review 2026-10-21, derived by hand";
const DOORWAY =
  "Tarkett: замер «учитывая выступы и дверные проемы», https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-linoleuma-i-ukhod/; заход в проём 10 см — практика укладчиков, не подтверждено (C10)";

/**
 * Hand derivations. For each width w and both directions: sheets n = least n with n·w − (n − 1)·50 ≥ the room
 * across the sheets; length = n × (room along + allowance, by default 5 cm), rounded up to the 10 cm cut step.
 * Fewest seams first, then the smallest bought area, then along the room length. Version 4: a sheet that runs
 * into a placed door (on a wall the sheets run toward or away from) is cut 10 cm longer. The example door is on
 * the bottom wall (x 3,2–4,0 m in a 4,6 m room): it counts only for sheets running along the width.
 */
export const golden: GoldenFile<LinoleumInput> = {
  tool: "linoleum",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 m: no width covers it, best is 2.5 m across with one seam (defaults)",
      input: {},
      expected: {
        items: { linoleum: { packs: 88 }, "seam-weld": { packs: 1, need: 4.6 } },
        summary: { width: 2.5, length: 8.8, sheets: 2, seams: 1, boughtArea: 22, waste: 2.22 },
        warnings: ["seams"],
      },
      source: {
        kind: "manual",
        ref: `${TARKETT}; ${REVIEW}; ${DOORWAY}. Шире 4,3 м рулонов нет (до 4 м) — минимум 1 шов. 2,5 м поперёк длины: 2 × 2,5 − 0,05 = 4,95 ≥ 4,6; 2 полотна × (4,3 + 0,05 припуск) = 8,7 м; шов на 2,475 м, дверь 3,2–4,0 м — на втором полотне, оно длиннее на 0,1: 8,8 м = 22 м² (v3 — 8,6 м без припуска и проёма). 3 м даёт 8,8 м и 26,4 м²; вдоль длины 2,5 м — 9,3 м, 23,25 м²`,
      },
    },
    {
      name: "Room 3 × 2.5 m without allowance: one 2.5 m sheet, tie broken along the length",
      input: { lengthMm: 3000, widthMm: 2500, allowanceMm: 0 },
      expected: {
        items: { linoleum: { packs: 30 } },
        summary: { width: 2.5, length: 3, seams: 0, boughtArea: 7.5, waste: 0 },
      },
      source: {
        kind: "manual",
        ref: "2,5 вдоль длины: 3,0 м = 7,5 м²; 3 м поперёк: 2,5 м = 7,5 м² — равно, берём вдоль длины",
      },
    },
    {
      name: "Allowance 5 cm by default goes on the sheet length only: room 3 × 2.5 m — 3.1 m of 2.5 m (v4)",
      input: { lengthMm: 3000, widthMm: 2500 },
      expected: {
        items: { linoleum: { packs: 31 } },
        summary: { width: 2.5, length: 3.1, seams: 0, boughtArea: 7.75 },
      },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Припуск 5 см к длине отреза (подсказка поля: «добавьте 5–10 см»; Tarkett — мерить по наибольшим размерам). 2,5 м вдоль длины: 3,05 → 3,1 м = 7,75 м²; 3 м поперёк: 2,55 → 2,6 м = 7,8 м². Поперёк рулон закрывает комнату как есть, припуск ширину не увеличивает: в v3 припуск 5 см к ширине уводил на рулон 3,5 м и 9,1 м²`,
      },
    },
    {
      name: "Only 3 m rolls in the shop",
      input: { rollWidthMm: 3000 },
      expected: { items: { linoleum: { packs: 88 } }, summary: { width: 3, seams: 1, boughtArea: 26.4 } },
      source: {
        kind: "manual",
        ref: "3 м: вдоль длины 2 × 4,65 = 9,3 м (27,9 м²), поперёк 2 × 4,35 = 8,7 м; шов на 2,975, дверь 3,2–4,0 — на втором полотне, +0,1: 8,8 м (26,4 м²)",
      },
    },
    {
      name: "Only 4 m rolls",
      input: { rollWidthMm: 4000 },
      expected: { items: { linoleum: { packs: 88 } }, summary: { width: 4, boughtArea: 35.2 } },
      source: {
        kind: "manual",
        ref: "4 м < 4,3 — два полотна; поперёк 2 × 4,35 = 8,7 м. Шов на 3,975 попал бы в дверь 3,2–4,0 — полотна зеркалятся, шов на 0,625, дверь целиком на широком полотне: +0,1 → 8,8 м × 4 = 35,2 м²",
      },
    },
    {
      name: "Only 1.5 m rolls: three sheets along the length",
      input: { rollWidthMm: 1500 },
      expected: { items: { linoleum: { packs: 140 } }, summary: { sheets: 3, seams: 2, boughtArea: 21 } },
      source: {
        kind: "manual",
        ref: "Вдоль длины: 3 × 1,5 − 0,1 = 4,4 ≥ 4,3 → 3 × 4,65 = 13,95 → 14,0 м = 21 м² (дверь на нижней стене — полотна идут вдоль неё, торцом не упираются); поперёк нужно 4 полотна (4,4 < 4,6)",
      },
    },
    {
      name: "Room 5 × 4.5 m: 2.5 m along the length",
      input: { lengthMm: 5000, widthMm: 4500 },
      expected: { items: { linoleum: { packs: 101 } }, summary: { width: 2.5, seams: 1, boughtArea: 25.25 } },
      source: {
        kind: "manual",
        ref: "Один шов: 2,5 вдоль длины 2 × 5,05 = 10,1 м = 25,25 м²; 3 м поперёк 2 × 4,55 = 9,1 м = 27,3 м²; 2,5 поперёк — 3 полотна (4,95 < 5)",
      },
    },
    {
      name: "Seam overlap makes a 4.97 m room need a third 2.5 m sheet",
      input: { lengthMm: 6000, widthMm: 4970, rollWidthMm: 2500 },
      expected: {
        items: { linoleum: { packs: 152 } },
        summary: { sheets: 3, seams: 2, boughtArea: 38 },
      },
      source: {
        kind: "manual",
        ref: `${TARKETT}. Вдоль длины 2 × 2,5 − 0,05 = 4,95 < 4,97 → 3 полотна × 6,05 = 18,15 м; поперёк 3 × 5,02 = 15,06 м. Дверь 4,6–5,4 м на нижней стене попадает на шов 4,925 — полотна зеркалятся (швы 1,075 и 3,525), дверь на первом полотне: +0,1 → 15,16 → 15,2 м = 38 м²`,
      },
    },
    {
      name: "Plain linoleum without a pattern: no overlap, two sheets",
      input: { lengthMm: 6000, widthMm: 4970, rollWidthMm: 2500, overlapMm: 0 },
      expected: { items: { linoleum: { packs: 121 } }, summary: { sheets: 2, seams: 1, boughtArea: 30.25 } },
      source: { kind: "manual", ref: "Без нахлёста 2 × 2,5 = 5 ≥ 4,97 → 2 × 6,05 = 12,1 м = 30,25 м²" },
    },
    {
      name: "Patterned linoleum, repeat 50 cm: the second sheet is cut longer",
      input: { pattern: true, repeatMm: 500 },
      expected: {
        items: { linoleum: { packs: 93 } },
        summary: { width: 2.5, length: 9.3, seams: 1, boughtArea: 23.25 },
      },
      source: {
        kind: "manual",
        ref: `${TARKETT} (подгонка рисунка). Второе полотно смещают до совпадения рисунка — до одного раппорта: 2 × 4,35 + 0,5 = 9,2 м, второе полотно под дверью +0,1 → 9,3 м × 2,5 = 23,25 м²; вдоль длины 9,3 + 0,5 = 9,8 м`,
      },
    },
    {
      name: "L-shaped room 6 × 5 m with a 3 × 2 m cut-out, 2.5 m roll",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 3000, cutWidthMm: 2000, rollWidthMm: 2500 },
      expected: {
        items: { linoleum: { packs: 133 } },
        summary: { sheets: 3, seams: 2, length: 13.3, boughtArea: 33.25 },
      },
      source: {
        kind: "manual",
        ref: `${TARKETT}; ${DOORWAY}. Поперёк (полотна вдоль 5 м, поперёк 6 м): 3 полотна с начала 0; 2,45; 4,9 — третье целиком в полосе выреза (с 3 м), оно короче на 2 м: 5,05 + 5,05 + 3,05 = 13,15 м. Дверь 4,6–5,4 м на внутренней стене выреза (y = 3 м): третье полотно кончается у неё — +0,1; второе идёт дальше (его вырезанный угол закрывает проём) → 13,25 → 13,3 м = 33,25 м². Вдоль длины: 6,05 + 6,05 + 3,05 → 15,2 м`,
      },
    },
    {
      name: "L-shape, allowance 10 cm: the second sheet lies wholly in the narrow part — short (v4)",
      input: {
        shape: "l",
        lengthMm: 6000,
        widthMm: 3000,
        cutLengthMm: 2000,
        cutWidthMm: 1050,
        rollWidthMm: 2000,
        allowanceMm: 100,
        pattern: true,
        repeatMm: 300,
      },
      expected: { items: { linoleum: { packs: 105 } }, summary: { sheets: 2, seams: 1, length: 10.5, boughtArea: 21 } },
      source: {
        kind: "manual",
        ref: `${TARKETT}; ${REVIEW}. Вдоль длины: отрез 6,1 м (припуск 10 см только к длине, v4), поперёк 3 м без припуска, шаг 2 − 0,05 = 1,95 м, 2 полотна. Первое полотно от стены, шов посередине нахлёста — 1,95 + 0,025 = 1,975 м, узкая часть с 3 − 1,05 = 1,95 м: полотно 2 целиком в ней, короче на 2 м: 6,1 + (4,1 + 0,3 раппорт) = 10,5 м = 21 м². В v2–v3 припуск сдвигал полотна поперёк на 5 см, шов был на 1,925 и второе полотно — целой длины (12,5 м)`,
      },
    },
    {
      name: "L-shape, no overlap: the seam right at the narrow part — the second sheet is short (v4)",
      input: {
        shape: "l",
        lengthMm: 6000,
        widthMm: 3000,
        cutLengthMm: 2000,
        cutWidthMm: 1000,
        rollWidthMm: 2000,
        allowanceMm: 100,
        overlapMm: 0,
      },
      expected: {
        items: { linoleum: { packs: 102 } },
        summary: { sheets: 2, seams: 1, length: 10.2, boughtArea: 20.4 },
      },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Вдоль длины: отрез 6,1 м, поперёк 3 м, шаг 2 м, 2 полотна; шов на 2,0 м, узкая часть с 3 − 1 = 2,0 м — полотно 2 целиком в ней: 6,1 + 4,1 = 10,2 м = 20,4 м² (пол узкой части 4 × 1 м закрыт). В v2–v3 сдвиг на половину припуска делал его целым (12,2 м)`,
      },
    },
    {
      name: "Length rounded up to the 10 cm cut step",
      input: { lengthMm: 4620, widthMm: 2400, allowanceMm: 0 },
      expected: {
        items: { linoleum: { packs: 47 } },
        summary: { width: 2.5, seams: 0 },
      },
      source: { kind: "manual", ref: "2,5 вдоль длины: 4,62 м → отрез 4,7 м (шаг 10 см) = 11,75 м²" },
    },
    {
      name: "Room 4 × 3 m without allowance: a 3 m roll along the length, no waste",
      input: { lengthMm: 4000, widthMm: 3000, allowanceMm: 0 },
      expected: {
        items: { linoleum: { packs: 40 } },
        summary: { width: 3, length: 4, boughtArea: 12, waste: 0 },
      },
      source: {
        kind: "manual",
        ref: "3 м вдоль: 4,0 м = 12 м²; 4 м поперёк: 3,0 м = 12 м² — равно, берём вдоль длины",
      },
    },
    {
      name: "Hall 12 × 8 m: two seams with 3 m rolls",
      input: { lengthMm: 12_000, widthMm: 8000 },
      expected: {
        items: { linoleum: { packs: 362 }, "seam-weld": { packs: 2, need: 24 } },
        summary: { width: 3, sheets: 3, seams: 2, boughtArea: 108.6 },
      },
      source: {
        kind: "manual",
        ref: "Меньше двух швов нельзя (2 × 4 − 0,05 < 8). Два шва: 3 м вдоль длины 3 × 12,05 = 36,15 → 36,2 м = 108,6 м²; 3,5 м — 126,7 м²; поперёк — от 3 швов",
      },
    },
    {
      name: "With pack prices: total cost",
      input: { price_linoleum: 800 } as Partial<LinoleumInput>,
      expected: { costTotal: 17600 },
      source: { kind: "manual", ref: "22 м² × 800 ₽/м² = 17 600 ₽ (8,8 м × 2,5 м)" },
    },
    {
      name: "Welding switched off: the seam hint asks to switch it on, nothing to weld bought",
      input: { weld: false },
      expected: { absentItems: ["seam-weld"], warnings: ["seams_no_weld"] },
      source: {
        kind: "manual",
        ref: "Пример комнаты кладут в 2 полотна — 1 стык; «Холодная сварка швов» выключена: сварку не берём и не пишем, что она в покупках",
      },
    },
    {
      name: "A repeat left with «Рисунок» off counts nothing (v3)",
      input: { pattern: false, repeatMm: 500 },
      expected: { summary: { length: 8.8 } },
      source: {
        kind: "manual",
        ref: "Как пример по умолчанию: 2 полотна по 4,35 м + 0,1 под дверью → 8,8 м, без раппорта; раппорт 50 см учитывается только с включённым «Рисунок нужно совмещать»",
      },
    },
    {
      name: "Sheets along the length, door on the end wall: the sheet under it is 10 cm longer (v4)",
      input: {
        lengthMm: 4000,
        widthMm: 3000,
        openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 1, offsetMm: 1000 }] }],
      },
      expected: { items: { linoleum: { packs: 42 } }, summary: { width: 3, sheets: 1, length: 4.2, boughtArea: 12.6 } },
      source: {
        kind: "manual",
        ref: `${REVIEW}; ${DOORWAY}. Рулон 3 м вдоль длины 4 м: одно полотно 4,0 + 0,05 = 4,05 м (4 м поперёк — 3,05 → 3,1 м, 12,4 м², больше). Дверь на правой стене — в неё полотно упирается торцом: +0,1 на заход в проём → 4,15 → 4,2 м = 12,6 м²`,
      },
    },
    {
      name: "Door on a side wall the sheets run along: no doorway extra (v4)",
      input: {
        lengthMm: 4000,
        widthMm: 3000,
        openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 0, offsetMm: 1000 }] }],
      },
      expected: { items: { linoleum: { packs: 41 } }, summary: { width: 3, length: 4.1, boughtArea: 12.3 } },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Дверь на верхней стене, полотно 3 м идёт вдоль неё: торцом в проём не упирается, отрез 4,05 → 4,1 м = 12,3 м²`,
      },
    },
  ],
};
