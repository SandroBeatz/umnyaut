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
        items: { "tile-adhesive": { packs: 5, need: 106.812, leftover: 18.188 } },
        summary: { adhesiveKg: 106.812, area: 19.78, notch: 10 },
        warnings: ["combined_method"],
      },
      source: {
        kind: "datasheet",
        ref: `${CM11}. от 30 × 30 — комбинированный способ: 4,2 + слой 1 мм на плитку 1,2 = 5,4 кг/м² × 19,78 = 106,812 кг / 25 = 4,3 → 5 мешков (толщина слоя на плитке в паспорте не указана — 1 мм, решение владельца)`,
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
        items: { "tile-adhesive": { packs: 3, need: 52.56 } },
        summary: { area: 14.6, notch: 8 },
        warnings: [],
      },
      source: { kind: "datasheet", ref: `${CM11}. Стены 16 − 1,4 = 14,6 м² × 3,6 = 52,56 кг → 3 мешка` },
    },
    {
      name: "Mosaic 5 × 5 cm",
      input: { tileLengthMm: 50, tileWidthMm: 50 },
      expected: { items: { "tile-adhesive": { packs: 2, need: 33.626 } }, summary: { notch: 3 } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 1,7 = 33,626 кг → 2 мешка` },
    },
    {
      name: "Tile 10 × 10 cm",
      input: { tileLengthMm: 100, tileWidthMm: 100 },
      expected: { items: { "tile-adhesive": { packs: 2, need: 39.56 } }, summary: { notch: 4 } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 2,0 = 39,56 кг → 2 мешка` },
    },
    {
      name: "Tile 15 × 15 cm",
      input: { tileLengthMm: 150, tileWidthMm: 150 },
      expected: { items: { "tile-adhesive": { packs: 3, need: 53.406 } }, summary: { notch: 6 } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 2,7 = 53,406 кг → 3 мешка` },
    },
    {
      name: "Porcelain 60 × 60 cm",
      input: { tileLengthMm: 600, tileWidthMm: 600 },
      expected: {
        items: { "tile-adhesive": { packs: 6, need: 132.526 } },
        summary: { notch: 12 },
        warnings: ["combined_method"],
      },
      source: { kind: "datasheet", ref: `${CM11}. (5,5 + 1,2) × 19,78 = 132,526 кг → 6 мешков` },
    },
    {
      name: "Large format 60 × 120 cm: beyond the table",
      input: { tileLengthMm: 1200, tileWidthMm: 600 },
      expected: { items: { "tile-adhesive": { packs: 6, need: 132.526 } }, warnings: ["large_format"] },
      source: {
        kind: "datasheet",
        ref: `${CM11}. Таблица кончается на 60 см «от 5,5 кг/м²» — берём 5,5 и предупреждаем`,
      },
    },
    {
      name: "By layer thickness 3 mm",
      input: { method: "layer", layerMm: 3 },
      expected: { items: { "tile-adhesive": { packs: 4, need: 94.944 } }, warnings: ["combined_method"] },
      source: {
        kind: "datasheet",
        ref: `${CM11}. (1,2 × 3 + 1,2) × 19,78 = 94,944 кг → 4 мешка (формула V = S × Vст × h, Ceresit)`,
      },
    },
    {
      name: "Layer 12 mm is thicker than allowed",
      input: { method: "layer", layerMm: 12 },
      expected: { items: { "tile-adhesive": { packs: 13, need: 308.568 } }, warnings: ["layer_too_thick"] },
      source: {
        kind: "datasheet",
        ref: `${CM11}: слой не больше 10 мм. (14,4 + 1,2) × 19,78 = 308,568 кг → 13 мешков`,
      },
    },
    {
      name: "5 kg bags",
      input: { bagKg: 5 },
      expected: { items: { "tile-adhesive": { packs: 22, need: 106.812, leftover: 3.188 } } },
      source: { kind: "datasheet", ref: `${CM11} (фасовка 5 кг). 106,812 / 5 = 21,4 → 22 мешка` },
    },
    {
      name: "Exactly two bags",
      input: { lengthMm: 5000, widthMm: 5000, tileLengthMm: 100, tileWidthMm: 100 },
      expected: { items: { "tile-adhesive": { packs: 2, need: 50, leftover: 0 } } },
      source: { kind: "manual", ref: "25 м² × 2,0 = 50 кг = 2 × 25 ровно" },
    },
    {
      name: "L-shaped floor 6 × 5 m with a 3 × 2 m cut-out",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 3000, cutWidthMm: 2000 },
      expected: { items: { "tile-adhesive": { packs: 6, need: 129.6 } }, summary: { area: 24 } },
      source: {
        kind: "datasheet",
        ref: `${CM11}. 30 − 6 = 24 м² × 5,4 = 129,6 кг → 6 мешков (прямоугольник дал бы 7)`,
      },
    },
    {
      name: "Without the layer on the tile: the bare datasheet rate",
      input: { backButterMm: 0 },
      expected: { items: { "tile-adhesive": { packs: 4, need: 83.076 } } },
      source: { kind: "datasheet", ref: `${CM11}. 19,78 × 4,2 = 83,076 кг → 4 мешка` },
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
      expected: { items: { "tile-adhesive": { packs: 4, need: 78.624 } }, summary: { area: 21.84 } },
      source: {
        kind: "manual",
        ref: "Пол 2,2 × 1,7 = 3,74 м² + стены 7,8 × 2,5 − дверь 0,7 × 2 = 18,1 м² = 21,84 м²; плитка до 25 см — зуб 8 мм, 3,6 кг/м² (Ceresit CM 11 PRO, https://ceresit.ru/ru/products/tiling/tile-adhesives/cm_11_pro/): 78,624 кг → 4 мешка по 25 кг (по отдельности 1 + 3 — тоже 4)",
      },
    },
    {
      name: "Floor and walls of the example room, tile 30 × 30 (v2)",
      input: { surface: "both" },
      expected: { items: { "tile-adhesive": { packs: 14, need: 348.624 } }, summary: { area: 64.56 } },
      source: {
        kind: "manual",
        ref: "Пол 4,6 × 4,3 = 19,78 м² + стены 17,8 × 2,7 − дверь 1,6 − окно 1,68 = 44,78 м² = 64,56 м². Плитка 30 × 30: зуб 10 мм 4,2 кг/м² + 1 мм на плитку 1,2 = 5,4 кг/м² (Ceresit CM 11 PRO, комбинированный способ) → 348,624 кг → 14 мешков (по отдельности 5 + 10 = 15)",
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
        "Qalculator берёт расход по зубу гребёнки без формата плитки: 8 мм — 5 кг/м², 21,84 × 5 = 109,2 кг → 5 мешков. Мы — по таблице Ceresit CM 11 PRO, где зуб 8 мм для плитки до 25 см даёт 3,6 кг/м²: 78,6 кг → 4. Площадь (пол + стены − проёмы) одинаковая",
    },
  ],
};
