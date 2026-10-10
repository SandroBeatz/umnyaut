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
        ref: `${FORMULA}. 1200 / 360 000 × 2 × 10 × 1,6 = 0,1067 × 19,78 × 1,1 = 2,32 кг → 2 упаковки`,
      },
    },
    {
      name: "Rectangular tile 30 × 60 cm, joint 2 mm, depth 9 mm",
      input: { tileLengthMm: 600, tileWidthMm: 300, jointMm: 2, depthMm: 9 },
      expected: { items: { grout: { packs: 2, need: 3.133152 } }, summary: { rate: 0.144 } },
      source: {
        kind: "manual",
        ref: `${FORMULA}. 900 / 180 000 × 2 × 9 × 1,6 = 0,144 × 19,78 × 1,1 = 3,133 кг → 2 упаковки`,
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
  ],
};
