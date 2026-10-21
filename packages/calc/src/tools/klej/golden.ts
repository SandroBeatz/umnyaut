import type { GoldenFile } from "../../golden";
import type { KlejInput } from "./index";

const CM11 =
  "Ceresit CM 11 PRO: расход по зубу шпателя (плитка до 5 / 10 / 15 / 25 / 30 / 60 см — 1,7 / 2,0 / 2,7 / 3,6 / 4,2 / от 5,5 кг/м²), 1,2 кг/м² на 1 мм слоя, мешок 25 кг, https://ceresit.ru/ru/products/tiling/tile-adhesives/cm_11_pro/";

/** Hand derivations: kg = area × rate (by the tile's longer side, or 1,2 × layer mm); bags = ⌈kg / bag⌉. */
export const golden: GoldenFile<KlejInput> = {
  tool: "klej",
  examples: [
    {
      name: "Floor 4.6 × 4.3 m, tile 30 × 30 cm (defaults)",
      input: {},
      expected: {
        items: { "tile-adhesive": { packs: 5, need: 112.1526, leftover: 12.8474 } },
        summary: { adhesiveKg: 112.1526, area: 19.78, notch: 10 },
        warnings: ["combined_method"],
      },
      source: {
        kind: "datasheet",
        ref: `${CM11}. от 30 × 30 — комбинированный способ: 4,2 + слой 1 мм на плитку 1,2 = 5,4 кг/м² × 19,78 = 106,812 кг + запас 5 % = 112,1526 кг / 25 = 4,5 → 5 мешков (толщина слоя на плитке в паспорте не указана — 1 мм, решение владельца)`,
      },
    },
    {
      name: "Bathroom walls 1.7 × 1.5 × 2.5 m with a door, tile 20 × 25 cm",
      input: {
        surface: "walls",
        lengthMm: 1700,
        widthMm: 1500,
        heightMm: 2500,
        openings: [{ type: "door", widthMm: 700, heightMm: 2000, count: 1 }],
        tileLengthMm: 250,
        tileWidthMm: 200,
      },
      expected: {
        items: { "tile-adhesive": { packs: 3, need: 55.188 } },
        summary: { area: 14.6, notch: 8 },
        warnings: [],
      },
      source: {
        kind: "datasheet",
        ref: `${CM11}. Стены 16 − 1,4 = 14,6 м² × 3,6 = 52,56 кг + 5 % = 55,188 кг → 3 мешка`,
      },
    },
    {
      name: "Mosaic 5 × 5 cm",
      input: { tileLengthMm: 50, tileWidthMm: 50 },
      expected: { items: { "tile-adhesive": { packs: 2, need: 35.3073 } }, summary: { notch: 3 } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 1,7 = 33,626 кг + 5 % = 35,3073 кг → 2 мешка` },
    },
    {
      name: "Tile 10 × 10 cm",
      input: { tileLengthMm: 100, tileWidthMm: 100 },
      expected: { items: { "tile-adhesive": { packs: 2, need: 41.538 } }, summary: { notch: 4 } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 2,0 = 39,56 кг + 5 % = 41,538 кг → 2 мешка` },
    },
    {
      name: "Tile 15 × 15 cm",
      input: { tileLengthMm: 150, tileWidthMm: 150 },
      expected: { items: { "tile-adhesive": { packs: 3, need: 56.0763 } }, summary: { notch: 6 } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 2,7 = 53,406 кг + 5 % = 56,0763 кг → 3 мешка` },
    },
    {
      name: "Porcelain 60 × 60 cm",
      input: { tileLengthMm: 600, tileWidthMm: 600 },
      expected: {
        items: { "tile-adhesive": { packs: 6, need: 139.1523 } },
        summary: { notch: 12 },
        warnings: ["combined_method"],
      },
      source: { kind: "datasheet", ref: `${CM11}. (5,5 + 1,2) × 19,78 = 132,526 кг + 5 % = 139,1523 кг → 6 мешков` },
    },
    {
      name: "Large format 60 × 120 cm: beyond the table",
      input: { tileLengthMm: 1200, tileWidthMm: 600 },
      expected: { items: { "tile-adhesive": { packs: 6, need: 139.1523 } }, warnings: ["large_format"] },
      source: {
        kind: "datasheet",
        ref: `${CM11}. Таблица кончается на 60 см «от 5,5 кг/м²» — берём 5,5 и предупреждаем: (5,5 + 1,2) × 19,78 × 1,05 = 139,1523 кг → 6 мешков`,
      },
    },
    {
      name: "By layer thickness 3 mm",
      input: { method: "layer", layerMm: 3 },
      expected: { items: { "tile-adhesive": { packs: 4, need: 99.6912 } }, warnings: ["combined_method"] },
      source: {
        kind: "datasheet",
        ref: `${CM11}. (1,2 × 3 + 1,2) × 19,78 = 94,944 кг + 5 % = 99,6912 кг → 4 мешка (формула V = S × Vст × h, Ceresit)`,
      },
    },
    {
      name: "Layer 12 mm is thicker than allowed",
      input: { method: "layer", layerMm: 12 },
      expected: { items: { "tile-adhesive": { packs: 13, need: 323.9964 } }, warnings: ["layer_too_thick"] },
      source: {
        kind: "datasheet",
        ref: `${CM11}: слой не больше 10 мм. (14,4 + 1,2) × 19,78 = 308,568 кг + 5 % = 323,9964 кг → 13 мешков`,
      },
    },
    {
      name: "5 kg bags",
      input: { bagKg: 5 },
      expected: { items: { "tile-adhesive": { packs: 23, need: 112.1526, leftover: 2.8474 } } },
      source: { kind: "datasheet", ref: `${CM11} (фасовка 5 кг). 112,1526 / 5 = 22,4 → 23 мешка` },
    },
    {
      // v3: the reserve set to 0 keeps this an exact pack multiple; the next case is the same room with it.
      name: "Exactly two bags without reserve",
      input: { lengthMm: 5000, widthMm: 5000, tileLengthMm: 100, tileWidthMm: 100, reservePct: 0 },
      expected: { items: { "tile-adhesive": { packs: 2, need: 50, leftover: 0 } } },
      source: { kind: "manual", ref: "25 м² × 2,0 = 50 кг = 2 × 25 ровно" },
    },
    {
      name: "Same room with the 5 % reserve: a third bag (v3)",
      input: { lengthMm: 5000, widthMm: 5000, tileLengthMm: 100, tileWidthMm: 100 },
      expected: { items: { "tile-adhesive": { packs: 3, need: 52.5, leftover: 22.5 } } },
      source: {
        kind: "manual",
        ref: "formula review 2026-10-21, derived by hand: 25 м² × 2,0 = 50 кг ровно на два мешка — без запаса на остатки в ведре и на шпателе клея не хватит; + 5 % (решение владельца 2026-10-21) = 52,5 кг → 3 мешка",
      },
    },
    {
      name: "Walls tiled to 1.5 m: openings only inside the band (v3)",
      input: {
        surface: "walls",
        lengthMm: 3000,
        widthMm: 2500,
        heightMm: 1500,
        openings: [
          { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
          { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
        ],
      },
      expected: {
        items: { "tile-adhesive": { packs: 4, need: 82.6686 } },
        summary: { area: 14.58 },
        warnings: ["combined_method"],
      },
      source: {
        kind: "manual",
        ref: `formula review 2026-10-21, derived by hand. Стены 2 × (3 + 2,5) × 1,5 = 16,5 м²; дверь 0,8 × 2,0 — в полосе до 1,5 м только 0,8 × 1,5 = 1,2; окно 1,2 × 1,4 на подоконнике 0,9 закрывает 900…1500 мм — 1,2 × 0,6 = 0,72: 16,5 − 1,92 = 14,58 м² (раньше вычиталось 1,6 + 1,68 = 3,28 → 13,22). ${CM11}: 5,4 кг/м² × 14,58 = 78,732 кг + 5 % = 82,6686 кг → 4 мешка`,
      },
    },
    {
      name: "L-shaped floor 6 × 5 m with a 3 × 2 m cut-out",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 3000, cutWidthMm: 2000 },
      expected: { items: { "tile-adhesive": { packs: 6, need: 136.08 } }, summary: { area: 24 } },
      source: {
        kind: "datasheet",
        ref: `${CM11}. 30 − 6 = 24 м² × 5,4 = 129,6 кг + 5 % = 136,08 кг → 6 мешков (прямоугольник дал бы 7)`,
      },
    },
    {
      name: "Without the layer on the tile: the bare datasheet rate",
      input: { backButterMm: 0 },
      expected: { items: { "tile-adhesive": { packs: 4, need: 87.2298 } } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 4,2 = 83,076 кг + 5 % = 87,2298 кг → 4 мешка` },
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
      expected: { absentItems: ["tile-adhesive"], warnings: ["openings_exceed_walls"] },
      source: { kind: "manual", ref: "Стены 10 м², окна 20 м² — клеить нечего" },
    },
    {
      name: "With pack prices: total cost",
      input: { "price_tile-adhesive": 550 } as Partial<KlejInput>,
      expected: { costTotal: 2750 },
      source: { kind: "manual", ref: "5 мешков × 550 = 2750 ₽" },
    },
    {
      name: "Floor and walls, bathroom 2.2 × 1.7 × 2.5 m, tile 20 × 20 (v2)",
      input: {
        surface: "both",
        lengthMm: 2200,
        widthMm: 1700,
        heightMm: 2500,
        openings: [{ type: "door", widthMm: 700, heightMm: 2000, count: 1 }],
        tileLengthMm: 200,
        tileWidthMm: 200,
      },
      expected: { items: { "tile-adhesive": { packs: 4, need: 82.5552 } }, summary: { area: 21.84 } },
      source: {
        kind: "manual",
        ref: "Пол 2,2 × 1,7 = 3,74 м² + стены 7,8 × 2,5 − дверь 0,7 × 2 = 18,1 м² = 21,84 м²; плитка до 25 см — зуб 8 мм, 3,6 кг/м² (Ceresit CM 11 PRO, https://ceresit.ru/ru/products/tiling/tile-adhesives/cm_11_pro/): 78,624 кг + 5 % = 82,5552 кг → 4 мешка по 25 кг (по отдельности 1 + 3 — тоже 4)",
      },
    },
    {
      name: "Floor and walls of the example room, tile 30 × 30 (v2)",
      input: { surface: "both" },
      expected: { items: { "tile-adhesive": { packs: 15, need: 366.0552 } }, summary: { area: 64.56 } },
      source: {
        kind: "manual",
        ref: "Пол 4,6 × 4,3 = 19,78 м² + стены 17,8 × 2,7 − дверь 1,6 − окно 1,68 = 44,78 м² = 64,56 м². Плитка 30 × 30: зуб 10 мм 4,2 кг/м² + 1 мм на плитку 1,2 = 5,4 кг/м² (Ceresit CM 11 PRO, комбинированный способ) → 348,624 кг + 5 % = 366,0552 кг → 15 мешков (по отдельности 5 + 11 = 16)",
      },
    },
  ],
  benchmarks: [
    {
      example: "Floor and walls, bathroom 2.2 × 1.7 × 2.5 m, tile 20 × 20 (v2)",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka-plitka.js",
      checkedAt: "2026-10-13",
      observed: { items: { "tile-adhesive": { packs: 5, need: 109.2 } } },
      explanation:
        "Qalculator берёт расход по зубу гребёнки без формата плитки: 8 мм — 5 кг/м², 21,84 × 5 = 109,2 кг → 5 мешков. Мы — по таблице Ceresit CM 11 PRO, где зуб 8 мм для плитки до 25 см даёт 3,6 кг/м², и 5 % запаса: 82,6 кг → 4. Площадь (пол + стены − проёмы) одинаковая",
    },
  ],
};
