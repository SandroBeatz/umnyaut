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
  ],
};
