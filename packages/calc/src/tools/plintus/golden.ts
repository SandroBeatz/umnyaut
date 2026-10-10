import type { GoldenFile } from "../../golden";
import type { PlintusInput } from "./index";

type Opening = PlintusInput["openings"][number];
const door = (widthMm: number, count = 1): Opening => ({ type: "door", widthMm, heightMm: 2000, count });

const PLANK =
  "Планка 2500 × 70 × 26 мм: Arbiton INDO, https://arbiton.com/ru/plintus/belyye-plintusy/plintusy-arbiton-indo-belyi-matovyi-40 (TDS https://pim.decora.pl/files/lctdTKqqOtvc572y.pdf); 2,2 м — IDEAL Классик";
const MANUAL =
  "Arbiton INDO, инструкция по монтажу: 4 способа (клей, скотч, скобы, саморезы), шаг крепления не больше 30–40 см, https://pim.decora.pl/files/wils3fj3u4fgwr3c.pdf";

/**
 * Hand derivations. Run = perimeter − door widths (windows don't touch the floor); planks = ⌈run / plank⌉,
 * offcuts joined with connectors; joiners = planks − 1; inner corners 4 (rectangle) or 5 (L-shape) + 1 outer;
 * end caps 2 per door.
 */
export const golden: GoldenFile<PlintusInput> = {
  tool: "plintus",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 m with a door (business spec example)",
      input: {},
      expected: {
        items: {
          plinth: { packs: 7, need: 17, leftover: 0.5 },
          "plinth-corner-in": { packs: 4 },
          "plinth-cap": { packs: 2 },
          "plinth-joiner": { packs: 6 },
          "plinth-fastener": { packs: 43 },
        },
        absentItems: ["plinth-corner-out"],
        summary: { run: 17, perimeter: 17.8 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${PLANK}. Бизнес-спецификация: «периметр 17,8 м минус дверь — 17 м, это 7 планок по 2,5 м». 7 × 2,5 = 17,5, остаток 0,5; стыков 6; 4 угла; дверь — 2 заглушки. ${MANUAL}: 17 / 0,4 = 42,5 → 43 крепежа`,
      },
    },
    {
      name: "Plank 2.2 m",
      input: { plankLengthMm: 2200 },
      expected: { items: { plinth: { packs: 8, leftover: 0.6 }, "plinth-joiner": { packs: 7 } } },
      source: { kind: "manual", ref: `${PLANK}. 17 / 2,2 = 7,7 → 8 планок, 17,6 − 17 = 0,6` },
    },
    {
      name: "Kitchen 3 × 3 m without doors",
      input: { lengthMm: 3000, widthMm: 3000, openings: [] },
      expected: {
        items: { plinth: { packs: 5, need: 12, leftover: 0.5 }, "plinth-joiner": { packs: 4 } },
        absentItems: ["plinth-cap"],
      },
      source: { kind: "manual", ref: "12 / 2,5 = 4,8 → 5 планок; без дверей заглушки не нужны" },
    },
    {
      name: "Run is an exact number of planks",
      input: { lengthMm: 5000, widthMm: 2500, openings: [] },
      expected: { items: { plinth: { packs: 6, need: 15, leftover: 0 }, "plinth-joiner": { packs: 5 } } },
      source: { kind: "manual", ref: "2 × 7,5 = 15 / 2,5 = 6 ровно, без остатка" },
    },
    {
      name: "L-shaped room 6 × 5 m with a 3 × 2 m cut-out and a door",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 3000, cutWidthMm: 2000, openings: [door(900)] },
      expected: {
        items: {
          plinth: { packs: 9, need: 21.1, leftover: 1.4 },
          "plinth-corner-in": { packs: 5 },
          "plinth-corner-out": { packs: 1 },
          "plinth-cap": { packs: 2 },
          "plinth-joiner": { packs: 8 },
        },
        summary: { perimeter: 22 },
      },
      source: {
        kind: "manual",
        ref: "Периметр Г-образной = периметру прямоугольника: 22; 22 − 0,9 = 21,1 / 2,5 = 8,44 → 9; стены 6, 5, 3, 2, 3, 3 — 5 внутренних углов и 1 наружный",
      },
    },
    {
      name: "Two doors",
      input: { lengthMm: 4000, widthMm: 3000, openings: [door(800, 2)] },
      expected: {
        items: {
          plinth: { packs: 5, need: 12.4, leftover: 0.1 },
          "plinth-cap": { packs: 4 },
          "plinth-joiner": { packs: 4 },
        },
      },
      source: { kind: "manual", ref: "14 − 1,6 = 12,4 / 2,5 = 4,96 → 5; две двери — 4 заглушки" },
    },
    {
      name: "A window does not shorten the plinth",
      input: { lengthMm: 4000, widthMm: 3000, openings: [{ type: "window", widthMm: 1200, heightMm: 1400, count: 1 }] },
      expected: { items: { plinth: { packs: 6, need: 14, leftover: 1 } }, absentItems: ["plinth-cap"] },
      source: { kind: "manual", ref: "Окно не на полу: 14 / 2,5 = 5,6 → 6 планок" },
    },
    {
      name: "Cut-out as wide as the room: counted as a rectangle",
      input: { shape: "l", lengthMm: 6000, widthMm: 5000, cutLengthMm: 7000, cutWidthMm: 1000, openings: [] },
      expected: {
        items: { plinth: { packs: 9, need: 22, leftover: 0.5 }, "plinth-corner-in": { packs: 4 } },
        absentItems: ["plinth-corner-out"],
        warnings: ["cut_too_large"],
      },
      source: { kind: "manual", ref: "Вырез 7 м длиннее комнаты 6 м — прямоугольник: 22 / 2,5 = 8,8 → 9, 4 угла" },
    },
    {
      name: "Doors wider than the whole perimeter: nothing to buy",
      input: { lengthMm: 1000, widthMm: 1000, openings: [door(5000)] },
      expected: {
        absentItems: ["plinth", "plinth-corner-in", "plinth-cap", "plinth-joiner"],
        warnings: ["doors_exceed_perimeter"],
      },
      source: { kind: "manual", ref: "Периметр 4 м, дверь 5 м — плинтус класть некуда" },
    },
    {
      name: "Door wider than any wall: warning",
      input: { lengthMm: 3000, widthMm: 1000, openings: [door(3500)] },
      expected: { items: { plinth: { packs: 2, need: 4.5, leftover: 0.5 } }, warnings: ["door_wider_than_wall"] },
      source: {
        kind: "manual",
        ref: "Дверь 3,5 м шире самой длинной стены 3 м — проверьте размеры; 8 − 3,5 = 4,5 → 2 планки",
      },
    },
    {
      name: "Hall 12 × 8 m with two double doors",
      input: { lengthMm: 12_000, widthMm: 8000, openings: [door(1400, 2)] },
      expected: {
        items: {
          plinth: { packs: 15, need: 37.2, leftover: 0.3 },
          "plinth-cap": { packs: 4 },
          "plinth-joiner": { packs: 14 },
        },
      },
      source: { kind: "manual", ref: "40 − 2,8 = 37,2 / 2,5 = 14,88 → 15 планок" },
    },
    {
      name: "Fasteners every 30 cm",
      input: { fastenerSpacingMm: 300 },
      expected: { items: { "plinth-fastener": { packs: 57 } } },
      source: { kind: "datasheet", ref: `${MANUAL}. 17 / 0,3 = 56,7 → 57` },
    },
    {
      name: "Glued or taped: no fasteners",
      input: { fasteners: false },
      expected: { items: { plinth: { packs: 7 } }, absentItems: ["plinth-fastener"] },
      source: { kind: "datasheet", ref: `${MANUAL}: клей и скотч — без дюбелей` },
    },
    {
      name: "Plank 2 m",
      input: { plankLengthMm: 2000 },
      expected: { items: { plinth: { packs: 9, leftover: 1 }, "plinth-joiner": { packs: 8 } } },
      source: { kind: "manual", ref: "17 / 2 = 8,5 → 9 планок, 18 − 17 = 1" },
    },
  ],
};
