import type { GoldenFile } from "../../golden";
import type { KraskaInput } from "./index";

type Opening = KraskaInput["openings"][number];
const door = (widthMm: number, heightMm: number, count = 1): Opening => ({ type: "door", widthMm, heightMm, count });
const window = (widthMm: number, heightMm: number, count = 1): Opening => ({
  type: "window",
  widthMm,
  heightMm,
  count,
});

const PAINT =
  "PARADE E2: 12–14 м²/л на слой, банки 0,9 / 2,7 / 9 л, https://parade.ru/catalog/professional/parade-professional-e2-pro-latex2/; берём 10 м²/л (решение владельца)";
const PRIMER =
  "Ceresit CT 17 PRO: 0,1–0,2 л/м², канистры 1 и 10 л, https://www.ceresit.ru/ru/products/tiling/supplementary-materials/ct_17_pro/";

/**
 * Hand derivations. Area = walls (perimeter × height − openings) and/or ceiling (L × W). Paint = area × coats /
 * coverage; cans = the set of 0,9 / 2,7 / 9 л with the least overbuy, then the fewest cans (all sizes are
 * multiples of 0,9, so the bought amount is the need rounded up to 0,9). Primer = area × 0,15 л, one coat,
 * whole canisters.
 */
export const golden: GoldenFile<KraskaInput> = {
  tool: "kraska",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 × 2.7 m, walls, two coats (defaults)",
      input: {},
      expected: {
        items: { paint: { packs: 1, need: 8.956, bought: 9, leftover: 0.044 }, primer: { packs: 1, need: 6.717 } },
        summary: { paintLitres: 8.956, area: 44.78, primerLitres: 6.717 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${PAINT}. Стены 44,78 м² × 2 / 10 = 8,956 л → банка 9 л (меньше 9,0 из кратных 0,9 не собрать). Грунт 44,78 × 0,15 = 6,717 л → 1 канистра 10 л. ${PRIMER}`,
      },
    },
    {
      name: "Ceiling only: 2.7 l + two 0.9 l cans",
      input: { surface: "ceiling" },
      expected: {
        items: { paint: { packs: 3, bought: 4.5 }, primer: { packs: 1, need: 2.967 } },
        summary: { paintLitres: 3.956, area: 19.78 },
      },
      source: {
        kind: "manual",
        ref: "Потолок 4,6 × 4,3 = 19,78 м² × 2 / 10 = 3,956 л → 4,5 л: 2,7 + 0,9 + 0,9 (3 банки; 5 × 0,9 — тоже 4,5, но банок больше)",
      },
    },
    {
      name: "Walls and ceiling: 9 + 2.7 + 2 × 0.9 l",
      input: { surface: "both" },
      expected: {
        items: { paint: { packs: 4, bought: 13.5 }, primer: { packs: 1, need: 9.684 } },
        summary: { paintLitres: 12.912, area: 64.56 },
      },
      source: {
        kind: "manual",
        ref: "44,78 + 19,78 = 64,56 м² × 2 / 10 = 12,912 л → 13,5 л: 9 + 2,7 + 0,9 + 0,9 (4 банки; 5 × 2,7 — 5 банок)",
      },
    },
    {
      name: "One coat",
      input: { coats: 1 },
      expected: { items: { paint: { packs: 3, bought: 4.5 } }, summary: { paintLitres: 4.478 } },
      source: { kind: "manual", ref: "44,78 / 10 = 4,478 л → 4,5 л: 2,7 + 0,9 + 0,9" },
    },
    {
      name: "Datasheet coverage 12 m²/l: three 2.7 l cans",
      input: { coverageM2PerL: 12 },
      expected: {
        items: { paint: { packs: 3, bought: 8.1, leftover: 0.636666667 } },
        summary: { paintLitres: 7.463333333 },
      },
      source: {
        kind: "datasheet",
        ref: `${PAINT}. 44,78 × 2 / 12 = 7,4633 л → 8,1 л = 3 × 2,7 (банка 9 л переплатит 1,54 л)`,
      },
    },
    {
      name: "Need exactly one 9 l can: 5 × 4 × 2.5 m without openings",
      input: { lengthMm: 5000, widthMm: 4000, heightMm: 2500, openings: [] },
      expected: { items: { paint: { packs: 1, need: 9, bought: 9, leftover: 0 }, primer: { packs: 1, need: 6.75 } } },
      source: { kind: "manual", ref: "18 × 2,5 = 45 м² × 2 / 10 = 9 л ровно → одна банка 9 л без остатка" },
    },
    {
      name: "Bathroom ceiling 1.7 × 1.5 m with a 1 l primer bottle",
      input: { lengthMm: 1700, widthMm: 1500, heightMm: 2500, openings: [], surface: "ceiling", primerPackL: 1 },
      expected: {
        items: { paint: { packs: 1, need: 0.51, bought: 0.9 }, primer: { packs: 1, need: 0.3825, bought: 1 } },
        summary: { area: 2.55 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `2,55 м² × 2 / 10 = 0,51 л → 1 банка 0,9 л; грунт 2,55 × 0,15 = 0,3825 л → 1 л. ${PRIMER}`,
      },
    },
    {
      name: "Without primer",
      input: { primer: false },
      expected: { items: { paint: { packs: 1 } }, absentItems: ["primer"], warnings: [] },
      source: { kind: "manual", ref: "Грунтовка выключена — только краска 9 л" },
    },
    {
      name: "Hall 12 × 8 × 3 m, four windows and two double doors",
      input: {
        lengthMm: 12_000,
        widthMm: 8000,
        heightMm: 3000,
        openings: [window(1800, 1600, 4), door(1400, 2100, 2)],
      },
      expected: {
        items: { paint: { packs: 3, bought: 20.7, leftover: 0.18 }, primer: { packs: 2, need: 15.39 } },
        summary: { area: 102.6, paintLitres: 20.52 },
      },
      source: {
        kind: "manual",
        ref: "120 − 17,4 = 102,6 м² × 2 / 10 = 20,52 л → 20,7 л = 9 + 9 + 2,7; грунт 15,39 л → 2 × 10 л",
      },
    },
    {
      name: "Door taller than the wall: warning, 2 × 2.7 + 2 × 0.9 l",
      input: { lengthMm: 4000, widthMm: 3000, openings: [door(900, 2800)] },
      expected: {
        items: { paint: { packs: 4, bought: 7.2 }, primer: { packs: 1, need: 5.292 } },
        summary: { area: 35.28, paintLitres: 7.056 },
        warnings: ["opening_too_tall"],
      },
      source: {
        kind: "manual",
        ref: "37,8 − 0,9 × 2,8 = 35,28 м² × 2 / 10 = 7,056 л → 7,2 л = 2,7 + 2,7 + 0,9 + 0,9 (8,1 = 3 × 2,7 переплатит больше)",
      },
    },
    {
      name: "Tiny room 0.3 × 0.3 m: a 10 l canister for half a litre is flagged",
      input: { lengthMm: 300, widthMm: 300, openings: [] },
      expected: {
        items: { paint: { packs: 1, need: 0.648 }, primer: { packs: 1, need: 0.486, leftover: 9.514 } },
        warnings: ["primer_small_need"],
      },
      source: {
        kind: "manual",
        ref: "Стены 1,2 × 2,7 = 3,24 м² × 2 / 10 = 0,648 л → 0,9 л; грунт 0,486 л → канистра 10 л (решение владельца: один объём), остаток 9,5 л > 4 × нужного — подсказка про 1 л",
      },
    },
    {
      name: "Openings larger than the walls: warning, nothing to buy",
      input: { lengthMm: 1000, widthMm: 1000, heightMm: 2500, openings: [window(5000, 2000, 2)] },
      expected: { absentItems: ["paint", "primer"], warnings: ["openings_exceed_walls"] },
      source: { kind: "manual", ref: "Стены 10 м², окна 20 м² — красить нечего" },
    },
    {
      name: "Ceiling paint is not blocked by openings larger than the walls",
      input: { lengthMm: 1000, widthMm: 1000, heightMm: 2500, openings: [window(5000, 2000, 2)], surface: "both" },
      expected: {
        items: { paint: { packs: 1, need: 0.2 } },
        summary: { area: 1 },
        warnings: ["openings_exceed_walls"],
      },
      source: { kind: "manual", ref: "Стены 0 (проёмы больше стен), потолок 1 м² × 2 / 10 = 0,2 л → 0,9 л" },
    },
    {
      name: "With pack prices: total cost",
      input: { price_paint: 600, price_primer: 1500 } as Partial<KraskaInput>,
      expected: { costTotal: 6900 },
      source: { kind: "manual", ref: "краска 9 л × 600 ₽/л + 1 канистра × 1500 = 6900 ₽" },
    },
  ],
};
