import type { GoldenFile } from "../../golden";
import type { LinoleumInput } from "./index";

const TARKETT =
  "Tarkett: замер по наибольшей длине и ширине, «избегайте швов, выбирая максимальную ширину рулона», нахлёст полотен 3–5 см для подгонки рисунка, https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-linoleuma-i-ukhod/";

/**
 * Hand derivations. For each width w and both directions: sheets n = least n with n·w − (n − 1)·50 ≥ the room
 * across the sheets (+ allowance); length = n × (room along + allowance), rounded up to the 10 cm cut step.
 * Fewest seams first, then the smallest bought area, then along the room length.
 */
export const golden: GoldenFile<LinoleumInput> = {
  tool: "linoleum",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 m: no width covers it, best is 2.5 m across with one seam (defaults)",
      input: {},
      expected: {
        items: { linoleum: { packs: 86 } },
        summary: { width: 2.5, length: 8.6, sheets: 2, seams: 1, boughtArea: 21.5, waste: 1.72 },
        warnings: ["seams"],
      },
      source: {
        kind: "manual",
        ref: `${TARKETT}. Шире 4,3 м рулонов нет (до 4 м) — минимум 1 шов. 2,5 м поперёк длины: 2 × 2,5 − 0,05 = 4,95 ≥ 4,6; 2 полотна × 4,3 = 8,6 м = 21,5 м². 3 м так же даёт 8,6 м, но 25,8 м²; вдоль длины 2,5 м — 9,2 м, 23 м²`,
      },
    },
    {
      name: "Room 3 × 2.5 m: one 2.5 m sheet, tie broken along the length",
      input: { lengthMm: 3000, widthMm: 2500 },
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
      name: "Allowance 5 cm on uneven walls: the 3 m roll no longer fits",
      input: { lengthMm: 3000, widthMm: 2500, allowanceMm: 50 },
      expected: {
        items: { linoleum: { packs: 26 } },
        summary: { width: 3.5, seams: 0, boughtArea: 9.1 },
      },
      source: {
        kind: "manual",
        ref: "Комната с припуском 3,05 × 2,55: 3 м поперёк уже не хватает (3,05), 3,5 м поперёк: 2,55 → 2,6 м = 9,1 м²; вдоль длины 3 м: 3,05 → 3,1 м = 9,3 м²",
      },
    },
    {
      name: "Only 3 m rolls in the shop",
      input: { rollWidthMm: 3000 },
      expected: { items: { linoleum: { packs: 86 } }, summary: { width: 3, seams: 1, boughtArea: 25.8 } },
      source: { kind: "manual", ref: "3 м: вдоль длины 2 × 4,6 = 9,2 м (27,6 м²), поперёк 2 × 4,3 = 8,6 м (25,8 м²)" },
    },
    {
      name: "Only 4 m rolls",
      input: { rollWidthMm: 4000 },
      expected: { items: { linoleum: { packs: 86 } }, summary: { width: 4, boughtArea: 34.4 } },
      source: { kind: "manual", ref: "4 м < 4,3 — два полотна; поперёк 8,6 м × 4 = 34,4 м²" },
    },
    {
      name: "Only 1.5 m rolls: three sheets along the length",
      input: { rollWidthMm: 1500 },
      expected: { items: { linoleum: { packs: 138 } }, summary: { sheets: 3, seams: 2, boughtArea: 20.7 } },
      source: {
        kind: "manual",
        ref: "Вдоль длины: 3 × 1,5 − 0,1 = 4,4 ≥ 4,3 → 3 × 4,6 = 13,8 м; поперёк нужно 4 полотна (4,4 < 4,6) → 17,2 м",
      },
    },
    {
      name: "Room 5 × 4.5 m: 2.5 m along the length",
      input: { lengthMm: 5000, widthMm: 4500 },
      expected: { items: { linoleum: { packs: 100 } }, summary: { width: 2.5, seams: 1, boughtArea: 25 } },
      source: {
        kind: "manual",
        ref: "Один шов: 2,5 вдоль длины 2 × 5 = 10 м = 25 м²; 3 м поперёк 2 × 4,5 = 9 м = 27 м²; 2,5 поперёк — 3 полотна (4,95 < 5)",
      },
    },
    {
      name: "Seam overlap makes a 4.97 m room need a third 2.5 m sheet",
      input: { lengthMm: 6000, widthMm: 4970, rollWidthMm: 2500 },
      expected: {
        items: { linoleum: { packs: 150 } },
        summary: { sheets: 3, seams: 2, boughtArea: 37.5 },
      },
      source: {
        kind: "manual",
        ref: `${TARKETT}. Вдоль длины 2 × 2,5 − 0,05 = 4,95 < 4,97 → 3 полотна × 6 = 18 м; поперёк 3 × 4,97 = 14,91 → 15,0 м = 37,5 м²`,
      },
    },
    {
      name: "Plain linoleum without a pattern: no overlap, two sheets",
      input: { lengthMm: 6000, widthMm: 4970, rollWidthMm: 2500, overlapMm: 0 },
      expected: { items: { linoleum: { packs: 120 } }, summary: { sheets: 2, seams: 1, boughtArea: 30 } },
      source: { kind: "manual", ref: "Без нахлёста 2 × 2,5 = 5 ≥ 4,97 → 2 × 6 = 12 м = 30 м²" },
    },
    {
      name: "Patterned linoleum, repeat 50 cm: the second sheet is cut longer",
      input: { repeatMm: 500 },
      expected: {
        items: { linoleum: { packs: 91 } },
        summary: { width: 2.5, length: 9.1, seams: 1, boughtArea: 22.75 },
      },
      source: {
        kind: "manual",
        ref: `${TARKETT} (подгонка рисунка). Второе полотно смещают до совпадения рисунка — до одного раппорта: 2 × 4,3 + 0,5 = 9,1 м × 2,5 = 22,75 м²; вдоль длины 9,2 + 0,5 = 9,7 м`,
      },
    },
    {
      name: "Length rounded up to the 10 cm cut step",
      input: { lengthMm: 4620, widthMm: 2400 },
      expected: {
        items: { linoleum: { packs: 47 } },
        summary: { width: 2.5, seams: 0 },
      },
      source: { kind: "manual", ref: "2,5 вдоль длины: 4,62 м → отрез 4,7 м (шаг 10 см) = 11,75 м²" },
    },
    {
      name: "Room 4 × 3 m: a 3 m roll along the length, no waste",
      input: { lengthMm: 4000, widthMm: 3000 },
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
      expected: { items: { linoleum: { packs: 360 } }, summary: { width: 3, sheets: 3, seams: 2, boughtArea: 108 } },
      source: {
        kind: "manual",
        ref: "Меньше двух швов нельзя (2 × 4 − 0,05 < 8). Два шва: 3 м вдоль длины 3 × 12 = 36 м = 108 м²; 3,5 м — 126 м²; поперёк — от 3 швов",
      },
    },
  ],
};
