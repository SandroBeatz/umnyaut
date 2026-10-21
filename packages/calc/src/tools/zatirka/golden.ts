import type { GoldenFile } from "../../golden";
import type { ZatirkaInput } from "./index";

const FORMULA =
  "Ceresit: V = (X + Y) / (X × Y) × Z × G × 1,6 кг/м², запас 10–15 %, https://ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-zatirki-dlya-plitki/";
const CE40 =
  "Ceresit CE 40 PREMIUM: упаковка 2 кг, шов 1–10 мм, https://www.ceresit.ru/ru/products/tiling/grouts-and-sealants/ce_40_aquastatic/";

/** Hand derivations: kg/m² = (A + B) / (A × B) × joint × depth × 1,6; kg = area × rate × (1 + reserve); packs = ⌈kg / pack⌉. */
export const golden: GoldenFile<ZatirkaInput> = {
  tool: "zatirka",
  examples: [
    {
      name: "Floor 4.6 × 4.3 m, tile 30 × 30 cm, joint 3 mm, depth 8 mm (defaults)",
      input: {},
      expected: {
        items: { grout: { packs: 3, need: 5.570048, leftover: 0.429952 } },
        summary: { groutKg: 5.570048, rate: 0.256, area: 19.78 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${FORMULA}. 600 / 90 000 × 3 × 8 × 1,6 = 0,256 кг/м² × 19,78 = 5,0637 × 1,1 = 5,570 кг / 2 → 3 упаковки. ${CE40}`,
      },
    },
    {
      name: "Bathroom walls, tile 20 × 25 cm, joint 2 mm, depth 7 mm",
      input: {
        surface: "walls",
        lengthMm: 1700,
        widthMm: 1500,
        heightMm: 2500,
        openings: [{ type: "door", widthMm: 700, heightMm: 2000, count: 1 }],
        tileLengthMm: 250,
        tileWidthMm: 200,
        jointMm: 2,
        depthMm: 7,
      },
      expected: { items: { grout: { packs: 2, need: 3.237696 } }, summary: { rate: 0.2016, area: 14.6 } },
      source: {
        kind: "manual",
        ref: `${FORMULA}. 450 / 50 000 × 2 × 7 × 1,6 = 0,2016 × 14,6 = 2,943 × 1,1 = 3,238 кг → 2 упаковки`,
      },
    },
    {
      name: "Mosaic 5 × 5 cm, joint 2 mm, depth 4 mm",
      input: { tileLengthMm: 50, tileWidthMm: 50, jointMm: 2, depthMm: 4 },
      expected: { items: { grout: { packs: 6, need: 11.140096 } }, summary: { rate: 0.512 } },
      source: {
        kind: "manual",
        ref: `${FORMULA}. 100 / 2500 × 2 × 4 × 1,6 = 0,512 × 19,78 × 1,1 = 11,14 кг → 6 упаковок`,
      },
    },
    {
      name: "Porcelain 60 × 60 cm, joint 2 mm, depth 10 mm",
      input: { tileLengthMm: 600, tileWidthMm: 600, jointMm: 2, depthMm: 10 },
      expected: { items: { grout: { packs: 2, need: 2.320853333 } }, summary: { rate: 0.106666667 } },
      source: {
        kind: "manual",
        ref: `${FORMULA}. формула 1200 / 360 000 × 2 × 10 × 1,6 = 0,107; таблица CE 40 для 60 × 60 и шва 2 — 0,15. Берём большее: 0,15 × 19,78 × 1,1 = 3,264 кг → 2 упаковки`,
      },
    },
    {
      name: "Rectangular tile 30 × 60 cm, joint 2 mm, depth 9 mm",
      input: { tileLengthMm: 600, tileWidthMm: 300, jointMm: 2, depthMm: 9 },
      expected: { items: { grout: { packs: 2, need: 3.133152 } }, summary: { rate: 0.144 } },
      source: {
        kind: "manual",
        ref: `${FORMULA}. формула 900 / 180 000 × 2 × 9 × 1,6 = 0,144; таблица CE 40, ближайший формат 20 × 60 и шов 2 — 0,3, на 30 × 60: 0,3 × (900 / 180 000) / (800 / 120 000) = 0,225. Берём большее: 0,225 × 19,78 × 1,1 = 4,896 кг → 3 упаковки`,
      },
    },
    {
      name: "Joint 12 mm is wider than the grout allows",
      input: { jointMm: 12 },
      expected: { items: { grout: { packs: 12, need: 22.280192 } }, warnings: ["joint_too_wide"] },
      source: {
        kind: "datasheet",
        ref: `${CE40}. 600 / 90 000 × 12 × 8 × 1,6 = 1,024 × 19,78 × 1,1 = 22,28 кг → 12 упаковок`,
      },
    },
    {
      name: "Joint 0.5 mm is narrower than the grout allows",
      input: { jointMm: 0.5 },
      expected: { items: { grout: { packs: 1, need: 0.928341333 } }, warnings: ["joint_too_narrow"] },
      source: {
        kind: "datasheet",
        ref: `${CE40}. 600 / 90 000 × 0,5 × 8 × 1,6 = 0,04267 × 19,78 × 1,1 = 0,928 кг → 1 упаковка`,
      },
    },
    {
      name: "L-shaped floor 6 × 5 m with a 3 × 2 m cut-out",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 3000, cutWidthMm: 2000 },
      expected: { items: { grout: { packs: 4, need: 6.7584 } }, summary: { area: 24 } },
      source: { kind: "manual", ref: `${FORMULA}. 24 м² × 0,256 × 1,1 = 6,758 кг → 4 упаковки` },
    },
    {
      name: "Cross-check with the CE 40 table: 40 × 40, joint 2, thick porcelain 12.5 mm",
      input: {
        lengthMm: 5000,
        widthMm: 2000,
        tileLengthMm: 400,
        tileWidthMm: 400,
        jointMm: 2,
        depthMm: 12.5,
        reservePct: 0,
      },
      expected: { items: { grout: { packs: 1, need: 2 } }, summary: { rate: 0.2 } },
      source: {
        kind: "datasheet",
        ref: `${CE40}: 40 × 40, шов 2 — 0,2 кг/м². Формула при глубине 12,5 мм: 800 / 160 000 × 2 × 12,5 × 1,6 = 0,2 — совпадает; таблица рассчитана на толстый керамогранит`,
      },
    },
    {
      name: "Cross-check with the CE 40 table: 60 × 60, joint 2, porcelain 14 mm",
      input: {
        lengthMm: 5000,
        widthMm: 2000,
        tileLengthMm: 600,
        tileWidthMm: 600,
        jointMm: 2,
        depthMm: 14,
        reservePct: 0,
      },
      expected: { items: { grout: { packs: 1, need: 1.493333333 } }, summary: { rate: 0.149333333 } },
      source: {
        kind: "datasheet",
        ref: `${CE40}: 60 × 60, шов 2 — ≈ 0,15 кг/м². Формула при глубине 14 мм: 1200 / 360 000 × 2 × 14 × 1,6 = 0,149 — совпадает с округлением таблицы`,
      },
    },
    {
      name: "5 kg packs",
      input: { packKg: 5 },
      expected: { items: { grout: { packs: 2, need: 5.570048 } } },
      source: { kind: "manual", ref: "5,570 / 5 = 1,11 → 2 упаковки" },
    },
    {
      name: "Reserve 15 %",
      input: { reservePct: 15 },
      expected: { items: { grout: { packs: 3, need: 5.823232 } } },
      source: { kind: "manual", ref: `${FORMULA}. 5,0637 × 1,15 = 5,823 кг → 3 упаковки` },
    },
    {
      name: "Exactly one pack without reserve",
      input: {
        lengthMm: 5000,
        widthMm: 1000,
        tileLengthMm: 100,
        tileWidthMm: 100,
        jointMm: 2.5,
        depthMm: 5,
        reservePct: 0,
      },
      expected: { items: { grout: { packs: 1, need: 2, leftover: 0 } }, summary: { rate: 0.4 } },
      source: { kind: "manual", ref: "200 / 10 000 × 2,5 × 5 × 1,6 = 0,4 кг/м² × 5 м² = 2,0 кг — ровно одна упаковка" },
    },
    {
      name: "Cross-check with the CE 40 table: 10 × 10 cm, joint 2 mm",
      input: {
        lengthMm: 5000,
        widthMm: 2000,
        tileLengthMm: 100,
        tileWidthMm: 100,
        jointMm: 2,
        depthMm: 6,
        reservePct: 0,
      },
      expected: { items: { grout: { packs: 2, need: 3.84 } }, summary: { rate: 0.384 } },
      source: {
        kind: "datasheet",
        ref: `${CE40}: для 10 × 10 и шва 2 мм ≈ 0,4 кг/м². По формуле с плиткой 6 мм — 0,384 кг/м², совпадает с округлением таблицы; 10 м² → 3,84 кг → 2 упаковки`,
      },
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
      expected: { absentItems: ["grout"], warnings: ["openings_exceed_walls"] },
      source: { kind: "manual", ref: "Стены 10 м², окна 20 м² — затирать нечего" },
    },
    {
      name: "With pack prices: total cost",
      input: { price_grout: 450 } as Partial<ZatirkaInput>,
      expected: { costTotal: 1350 },
      source: { kind: "manual", ref: "3 упаковки × 450 = 1350 ₽" },
    },
    {
      name: "Floor and walls, bathroom 2.2 × 1.7 × 2.5 m, tile 20 × 20, joint 2, depth 7 (v2)",
      input: {
        surface: "both",
        lengthMm: 2200,
        widthMm: 1700,
        heightMm: 2500,
        openings: [{ type: "door", widthMm: 700, heightMm: 2000, count: 1 }],
        tileLengthMm: 200,
        tileWidthMm: 200,
        jointMm: 2,
        depthMm: 7,
      },
      expected: { items: { grout: { packs: 3, need: 5.381376 } }, summary: { area: 21.84, rate: 0.224 } },
      source: {
        kind: "manual",
        ref: "Ceresit: (200 + 200) / (200 × 200) × 2 × 7 × 1,6 = 0,224 кг/м² (https://ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-zatirki-dlya-plitki/); пол 3,74 + стены 18,1 = 21,84 м² × 0,224 × 1,1 = 5,381 кг → 3 упаковки по 2 кг (по отдельности 1 + 3 = 4)",
      },
    },
    {
      name: "Floor and walls of the example room (v2)",
      input: { surface: "both" },
      expected: { items: { grout: { packs: 10, need: 18.180096 } }, summary: { area: 64.56 } },
      source: {
        kind: "manual",
        ref: "(300 + 300) / (300 × 300) × 3 × 8 × 1,6 = 0,256 кг/м²; пол 19,78 + стены 44,78 = 64,56 м² × 0,256 × 1,1 = 18,18 кг → 10 упаковок по 2 кг (по отдельности 3 + 7 = 10)",
      },
    },
    {
      name: "Walls tiled to 1.5 m: openings only inside the band (v3)",
      input: {
        surface: "walls",
        lengthMm: 3000,
        widthMm: 2500,
        heightMm: 2500,
        tileHeightMm: 1500,
        openings: [
          { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
          { type: "window", widthMm: 1200, heightMm: 1400, count: 1 },
        ],
      },
      expected: { items: { grout: { packs: 3, need: 4.105728 } }, summary: { area: 14.58 } },
      source: {
        kind: "manual",
        ref: `formula review 2026-10-21, derived by hand; re-review: «Высота облицовки» 1,5 м в комнате высотой 2,5 м. Стены 11 × 1,5 = 16,5 м²; в полосе до 1,5 м дверь 0,8 × 1,5 = 1,2, окно на подоконнике 0,9 — 1,2 × 0,6 = 0,72: 14,58 м² (v2 вычитал 3,28 → 13,22 м², 3,72 кг, 2 упаковки). ${FORMULA}: 0,256 кг/м² × 14,58 × 1,1 = 4,105728 кг → 3 упаковки по 2 кг (${CE40})`,
      },
    },
    {
      name: "Tile height 2.0 m in a 2.5 m room, door 0.8 × 2.0 (v3)",
      input: {
        surface: "walls",
        lengthMm: 3000,
        widthMm: 2500,
        heightMm: 2500,
        tileHeightMm: 2000,
        openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 0, offsetMm: 600 }] }],
      },
      expected: { items: { grout: { packs: 3, need: 5.74464 } }, summary: { area: 20.4 } },
      source: {
        kind: "manual",
        ref: `re-review 2026-10-21, derived by hand: «Высота облицовки» 2,0 м в комнате 2,5 м: 11 × 2,0 − 0,8 × 2,0 = 20,4 м². ${FORMULA}: 0,256 кг/м² × 20,4 × 1,1 = 5,74464 кг → 3 упаковки по 2 кг`,
      },
    },
  ],
  benchmarks: [
    {
      example: "Floor and walls, bathroom 2.2 × 1.7 × 2.5 m, tile 20 × 20, joint 2, depth 7 (v2)",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka-zatirka.js",
      checkedAt: "2026-10-13",
      observed: { items: { grout: { packs: 3, need: 5.381376 } } },
      explanation:
        "Та же формула Ceresit, K 1,6 (CE 40), запас 10 %, упаковка 2 кг; площадь 21,84 м² вводится вручную — совпадает",
    },
  ],
};
