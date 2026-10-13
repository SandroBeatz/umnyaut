import type { GoldenFile } from "../../golden";
import type { PlitkaInput } from "./index";

const KM =
  "KERAMA MARAZZI, «Как рассчитать количество плитки»: штучный метод (целые + подрезка), запас 10 % на прямую и 15 % на диагональ, раскладка от стены или от центра, https://ufa.kerama-marazzi.com/blog/stati/kak-rasschitat-kolichestvo-plitki-podrobnoe-rukovodstvo/";

/**
 * Hand derivations. Along a span from a corner: whole = ⌊(span + joint) / (tile + joint)⌋, cut = span − whole ×
 * (tile + joint). From the centre: n tiles in the middle, two cuts of (span − n·tile − (n+1)·joint) / 2, the
 * parity with the wider cut. Tiles = whole + one per cut piece, × (1 + reserve), rounded up; boxes = ⌈tiles / box⌉.
 */
export const golden: GoldenFile<PlitkaInput> = {
  tool: "plitka",
  examples: [
    {
      name: "Floor 4.6 × 4.3 m, tile 30 × 30, joint 3, from a corner (defaults)",
      input: {},
      expected: {
        items: {
          tile: { packs: 22, need: 264, leftover: 0 },
          "tile-adhesive": { packs: 5, need: 106.812 },
          grout: { packs: 3, need: 5.570048 },
        },
        summary: { whole: 210, cut: 30, tiles: 264 },
        warnings: ["narrow_cut"],
      },
      source: {
        kind: "manual",
        ref: `${KM}. 4600: 15 целых, подрезка 55; 4300: 14 целых, подрезка 58. 15 × 14 = 210 + 15 + 14 + 1 = 240 × 1,1 = 264 плитки / 12 = 22 коробки. Подрезка 55 мм уже четверти плитки — советуем от центра`,
      },
    },
    {
      name: "Same floor from the centre",
      input: { start: "center" },
      expected: { items: { tile: { packs: 22, need: 264 } }, summary: { whole: 182, cut: 58 }, warnings: [] },
      source: {
        kind: "manual",
        ref: `${KM}. 4600: 14 целых и по 177,5 с краёв; 4300: 13 целых и по 179. 182 + 2 × 13 + 2 × 14 + 4 = 240 × 1,1 = 264`,
      },
    },
    {
      name: "Porcelain 60 × 60, joint 2, 4 per box",
      input: { tileLengthMm: 600, tileWidthMm: 600, jointMm: 2, tilesPerBox: 4 },
      expected: { items: { tile: { packs: 18, need: 71 } }, summary: { whole: 49, cut: 15 } },
      source: {
        kind: "manual",
        ref: `${KM}. 4600: 7 целых, 386; 4300: 7 целых, 86. 49 + 7 + 7 + 1 = 64 × 1,1 = 70,4 → 71 / 4 → 18 коробок`,
      },
    },
    {
      name: "Tile 30 × 60 along the length, 8 per box",
      input: { tileLengthMm: 600, tileWidthMm: 300, tilesPerBox: 8 },
      expected: { items: { tile: { packs: 17, need: 132 } }, summary: { whole: 98, cut: 22 } },
      source: {
        kind: "manual",
        ref: `${KM}. 4600 по 603: 7 целых, 379; 4300 по 303: 14 целых, 58. 98 + 14 + 7 + 1 = 120 × 1,1 = 132 / 8 → 17`,
      },
    },
    {
      name: "Primer under the floor tile, mockup room: one 10 l canister",
      input: {},
      expected: { items: { primer: { packs: 1, need: 2.967, leftover: 7.033 } } },
      source: {
        kind: "manual",
        ref: "Пол 4,6 × 4,3 = 19,78 м² × 0,15 л/м² = 2,967 л → 1 канистра 10 л. Ceresit CT 17 PRO: грунтовка впитывающих оснований под плитку, 0,1–0,2 л/м² за слой, https://www.ceresit.ru/ru/products/tiling/supplementary-materials/ct_17_pro/",
      },
    },
    {
      name: "Primer under wall tile, 5 l canisters: two",
      input: { surface: "walls", primerPackL: 5 },
      expected: { items: { primer: { packs: 2, need: 6.717, leftover: 3.283 } } },
      source: {
        kind: "manual",
        ref: "Стены 17,8 × 2,7 = 48,06 − дверь 0,8 × 2 − окно 1,2 × 1,4 = 44,78 м² × 0,15 = 6,717 л → 2 канистры по 5 л, останется 3,283 л (Ceresit CT 17 PRO, 0,1–0,2 л/м²)",
      },
    },
    {
      name: "Primer switched off: no primer to buy",
      input: { primer: false },
      expected: { items: { tile: { packs: 22 } }, absentItems: ["primer"] },
      source: {
        kind: "manual",
        ref: "«Грунтовать основание» выключено — грунтовку не берём; плитка та же, 22 коробки",
      },
    },
    {
      name: "Room fits whole tiles exactly",
      // No openings: the example window (1.55 m from the corner) would not fit this 2.1 m wall and warn.
      input: { lengthMm: 3027, widthMm: 2118, openings: [] },
      expected: {
        items: { tile: { packs: 7, need: 77 } },
        summary: { whole: 70, cut: 0 },
        warnings: ["primer_small_need"],
      },
      source: {
        kind: "manual",
        ref: "10 × 300 + 9 × 3 = 3027, 7 × 300 + 6 × 3 = 2118 — 70 целых без подрезки × 1,1 = 77 / 12 → 7. Подсказок о раскладке нет; грунтовки 6,41 × 0,15 = 0,96 л на канистру 10 л — подсказка взять 1 л (v4)",
      },
    },
    {
      name: "A 3 mm rest at the far wall is a gap, not a cut row (v2)",
      input: { lengthMm: 3033, widthMm: 2118, openings: [] },
      expected: {
        items: { tile: { packs: 7, need: 77 } },
        summary: { whole: 70, cut: 0 },
        warnings: ["primer_small_need"],
      },
      source: {
        kind: "manual",
        ref: "10 × 300 + 9 × 3 = 3027; остаётся 6 мм — шов у плитки и 3 мм у стены, резать нечего: 70 целых × 1,1 = 77 / 12 → 7. В v1 это было 7 подрезанных плиток по 3 мм и 85 штук",
      },
    },
    {
      name: "Same room without reserve",
      input: { lengthMm: 3027, widthMm: 2118, reservePct: 0 },
      expected: { items: { tile: { packs: 6, need: 70, leftover: 2 } } },
      source: { kind: "manual", ref: "70 плиток / 12 = 5,8 → 6 коробок, останется 2" },
    },
    {
      name: "Rectified tile without a joint",
      input: { lengthMm: 3000, widthMm: 3000, jointMm: 0 },
      expected: { items: { tile: { packs: 10, need: 110 } }, summary: { whole: 100, cut: 0 } },
      source: { kind: "manual", ref: "3000 / 300 = 10 ровно; 100 × 1,1 = 110 / 12 → 10" },
    },
    {
      name: "Diagonal: area + 15 %",
      input: { layout: "diagonal" },
      expected: { items: { tile: { packs: 22, need: 253 } } },
      source: { kind: "manual", ref: `${KM}. 19,78 / 0,09 = 219,8 × 1,15 = 252,7 → 253 плитки / 12 → 22` },
    },
    {
      name: "Bathroom walls 1.7 × 1.5 × 2.5 m, tile 20 × 25 upright, joint 2, door",
      input: {
        surface: "walls",
        lengthMm: 1700,
        widthMm: 1500,
        heightMm: 2500,
        openings: [{ type: "door", widthMm: 700, heightMm: 2000, count: 1 }],
        tileLengthMm: 200,
        tileWidthMm: 250,
        jointMm: 2,
        tilesPerBox: 20,
      },
      expected: {
        items: {
          tile: { packs: 18, need: 359 },
          "tile-adhesive": { packs: 3, need: 52.56 },
          grout: { packs: 2, need: 3.700224 },
        },
        summary: { whole: 256, cut: 70 },
      },
      source: {
        kind: "manual",
        ref: `${KM}. Высота 2500 по 252: 9 целых, 232. Стена 1700 по 202: 8 целых, 84 → 72 + 8 + 9 + 1 = 90; стена 1500: 7 целых, 86 → 63 + 7 + 9 + 1 = 80. 2 × 90 + 2 × 80 = 340; дверь где угодно по ширине наверняка закрывает ⌊(700 − 200) / 202⌋ = 2 целые в ряду, по высоте стоит на полу — ⌊2002 / 252⌋ = 7 рядов: 14 → 326 × 1,1 = 358,6 → 359 / 20 → 18`,
      },
    },
    {
      name: "Bathroom walls with the door placed: counted tile by tile around it (v3)",
      input: {
        surface: "walls",
        lengthMm: 1700,
        widthMm: 1500,
        heightMm: 2500,
        openings: [{ type: "door", widthMm: 700, heightMm: 2000, count: 1, places: [{ wall: 0, offsetMm: 500 }] }],
        tileLengthMm: 200,
        tileWidthMm: 250,
        jointMm: 2,
        tilesPerBox: 20,
      },
      expected: { items: { tile: { packs: 18, need: 359 } }, summary: { whole: 238, cut: 88 } },
      source: {
        kind: "manual",
        ref: `${KM}. Без двери 340 плиток: 270 целых, 70 подрезанных. Дверь на стене 1 от 500 до 1200 мм, высота 2000: столбцы по 202 мм — целиком внутри 606 и 808 (2), задеты 404…1010 (4); ряды от пола по 252 — внутри 0…1512 (7), задеты 0…1764 (8). Не кладём 2 × 7 = 14, по краю двери подрезаем 4 × 8 − 14 = 18: целых 270 − 14 − 18 = 238, подрезанных 70 + 18 = 88, всего 326 × 1,1 = 358,6 → 359 / 20 → 18 — столько же, сколько по оценке без плана`,
      },
    },
    {
      name: "Walls of the example room, door and window placed (v3)",
      input: { surface: "walls" },
      expected: {
        items: { tile: { packs: 49, need: 588 } },
        summary: { whole: 406, cut: 128 },
        warnings: ["narrow_cut"],
      },
      source: {
        kind: "manual",
        ref: `${KM}. Высота 2700 по 303: 8 целых рядов от пола и подрезка 276 под потолком; стена 4600: 15 целых и 55, стена 4300: 14 целых и 58. Без проёмов 2 × 144 + 2 × 135 = 558 плиток (464 целых, 94 подрезанных). Дверь 800 × 2000 на стене 3 от 600 мм: внутри столбцы 606, 909 × ряды 0…1515 = 12, по краю 4 × 7 − 12 = 16. Окно 1200 × 1400 на стене 4 от 1550 мм, подоконник 90 см (900…2300): внутри столбцы 1818…2424 (3) × ряды 909…1818 (4) = 12, по краю 5 × 6 − 12 = 18. Целых 464 − 24 − 34 = 406, подрезанных 94 + 34 = 128, всего 534 × 1,1 = 587,4 → 588 / 12 → 49. Без мест на плане оценка дала бы 601 (51 коробку)`,
      },
    },
    {
      name: "Same walls, the window sill at 1 m",
      input: {
        surface: "walls",
        openings: [
          { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
          {
            type: "window",
            widthMm: 1200,
            heightMm: 1400,
            count: 1,
            places: [{ wall: 3, offsetMm: 1550, sillMm: 1000 }],
          },
        ],
      },
      expected: { items: { tile: { packs: 50, need: 591 } }, summary: { whole: 411, cut: 126 } },
      source: {
        kind: "manual",
        ref: `${KM}. Окно 1000…2400 от пола: внутри ряды 1212…1818 (3) × 3 столбца = 9, по краю 5 × 5 − 9 = 16 (было 12 и 18). Целых 406 + 12 − 9 + 18 − 16 = 411, подрезанных 128 − 18 + 16 = 126, всего 537 × 1,1 = 590,7 → 591 / 12 → 50`,
      },
    },
    {
      name: "Same walls, door and window not placed: the estimate",
      input: {
        surface: "walls",
        openings: [
          { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
          { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
        ],
      },
      expected: { items: { tile: { packs: 51, need: 601 } }, summary: { whole: 452, cut: 94 } },
      source: {
        kind: "manual",
        ref: `${KM}. 558 плиток без проёмов; дверь где угодно закрывает ⌊(800 − 300) / 303⌋ = 1 × ⌊2003 / 303⌋ = 6 целых, окно ⌊900 / 303⌋ = 2 × ⌊1100 / 303⌋ = 3 = 6: целых 464 − 12 = 452, подрезанных 94, всего 546 × 1,1 = 600,6 → 601 / 12 → 51`,
      },
    },
    {
      name: "Floor smaller than one tile",
      input: { lengthMm: 500, widthMm: 400, tileLengthMm: 600, tileWidthMm: 600, tilesPerBox: 4 },
      expected: { items: { tile: { packs: 1, need: 2 } }, summary: { whole: 0, cut: 1 } },
      source: { kind: "manual", ref: "Комната меньше плитки: один отрезок, × 1,1 = 1,1 → 2 плитки, 1 коробка" },
    },
    {
      name: "Wall openings larger than the walls: nothing to buy",
      input: {
        surface: "walls",
        lengthMm: 1000,
        widthMm: 1000,
        heightMm: 2500,
        openings: [{ type: "window", widthMm: 5000, heightMm: 2000, count: 2 }],
      },
      expected: { absentItems: ["tile"], warnings: ["openings_exceed_walls"] },
      source: { kind: "manual", ref: "Стены 10 м², окна 20 м² — класть нечего" },
    },
    {
      name: "L-shaped floor 6 × 5 m with a 3 × 2 m cut-out",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 3000, cutWidthMm: 2000 },
      expected: {
        items: { tile: { packs: 28, need: 330 }, "tile-adhesive": { packs: 6, need: 129.6 } },
        summary: { whole: 264, cut: 36, area: 24 },
      },
      source: {
        kind: "manual",
        ref: `${KM}. Прямоугольник 6 × 5: 6000 — 19 целых и 243, 5000 — 16 целых и 152: 304 + 19 + 16 + 1 = 340. В вырезе 3 × 2 наверняка лежат ⌊(3000 − 300) / 303⌋ × ⌊(2000 − 300) / 303⌋ = 8 × 5 = 40 целых — их не берём: 300 × 1,1 = 330 / 12 → 28. Клей на 24 м² × 5,4 = 129,6 кг → 6 мешков`,
      },
    },
    {
      name: "Without adhesive and grout",
      input: { adhesive: false, grout: false },
      expected: { items: { tile: { packs: 22 } }, absentItems: ["tile-adhesive", "grout"] },
      source: { kind: "manual", ref: "Сопутствующие выключены — только плитка" },
    },
    {
      name: "Reserve 15 % on a complex room",
      input: { reservePct: 15 },
      expected: { items: { tile: { packs: 23, need: 276 } } },
      source: { kind: "manual", ref: `${KM}. 240 × 1,15 = 276 / 12 → 23` },
    },
    {
      name: "With pack prices: total cost",
      input: { price_tile: 1200 } as Partial<PlitkaInput>,
      expected: { costTotal: 26400 },
      source: { kind: "manual", ref: "22 коробки × 1200 = 26 400 ₽; клей и затирка без цены" },
    },
  ],
};
