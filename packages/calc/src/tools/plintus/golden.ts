import type { GoldenFile } from "../../golden";
import type { PlintusInput } from "./index";

type Opening = PlintusInput["openings"][number];
const door = (widthMm: number, count = 1): Opening => ({ type: "door", widthMm, heightMm: 2000, count });

const PLANK =
  "Планка 2500 × 70 × 26 мм: Arbiton INDO, https://arbiton.com/ru/plintus/belyye-plintusy/plintusy-arbiton-indo-belyi-matovyi-40 (TDS https://pim.decora.pl/files/lctdTKqqOtvc572y.pdf); 2,2 м — IDEAL Классик";
const MANUAL =
  "Arbiton INDO, инструкция по монтажу: 4 способа (клей, скотч, скобы, саморезы), шаг крепления не больше 30–40 см, https://pim.decora.pl/files/wils3fj3u4fgwr3c.pdf";

const REVIEW = "Formula review 2026-10-21, derived by hand";
const MIN_PIECE =
  "Кусок не короче 30 см — практика монтажников, не подтверждено (C10): короткий кусок плохо держится на дюбеле и отходит на стыке";

/**
 * Hand derivations. Run = perimeter − door widths (windows don't touch the floor). Version 2 (P16.7a): planks
 * by the cut plan — runs laid as a ribbon from the longest, clockwise; the rest of a plank starts the next run if
 * it is ≥ 30 cm or covers that run; no piece under 30 cm in a run (a short tail takes from the plank before);
 * one more plank when less than 30 cm is left at the end. Doors not placed: each splits the longest run in two.
 * Joiners = joints in the middle of runs; inner corners 4 (rectangle) or 5 (L-shape) + 1 outer, less the corners
 * a placed door takes; end caps 2 per door.
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
          "plinth-fastener": { packs: 49 },
        },
        absentItems: ["plinth-corner-out"],
        summary: { run: 17, perimeter: 17.8 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${PLANK}. Бизнес-спецификация: «периметр 17,8 м минус дверь — 17 м, это 7 планок по 2,5 м». Раскрой от стены 1 (4,6): 2,5 + 2,1 | 0,4 + 2,5 + 1,4 | 0,6 (остаток) | 0,5 + 2,4 + 0,3 (хвост 0,2 < 30 см — предыдущая планка короче) | 2,2 + 2,1; остаток 0,4 ≥ 30 см — запасная не нужна. 7 × 2,5 = 17,5, остаток 0,5; стыков посреди участков 1 + 2 + 0 + 2 + 1 = 6; 4 угла; дверь — 2 заглушки. ${MANUAL}: крепёж на каждый прямой участок: ⌈участок / 0,4⌉ + 1 (по краям), участки 1,9 + 1,9 (дверь посередине стены 4,6), 4,3, 4,6, 4,3 → 6 + 6 + 12 + 13 + 12 = 49`,
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
      name: "Run is an exact number of planks: one spare plank (v2)",
      input: { lengthMm: 5000, widthMm: 2500, openings: [] },
      expected: {
        items: { plinth: { packs: 7, need: 15, leftover: 2.5 }, "plinth-joiner": { packs: 2 } },
      },
      source: {
        kind: "manual",
        ref: `${REVIEW}. 2 × 7,5 = 15 / 2,5 = 6 ровно: стены 5 = 2,5 + 2,5, 2,5 — целая. Остаток 0 — ни сантиметра на ошибку при резке, берём ещё одну: 7 планок (в версии 1 — 6). Стыки посреди стен только на двух стенах по 5 м: 2 соединителя (было 6 − 1 = 5)`,
      },
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
          "plinth-joiner": { packs: 6 },
        },
        summary: { perimeter: 22 },
      },
      source: {
        kind: "manual",
        ref: "Периметр Г-образной = периметру прямоугольника: 22; 22 − 0,9 = 21,1 / 2,5 = 8,44 → 9; стены 6, 5, 3, 2, 3, 3 — 5 внутренних углов и 1 наружный. Дверь не отмечена — делит стену 6 на 2,55 + 2,55. Раскрой от стены 5: 2,5 + 2,5 | 2,5 + 0,5 | 2,0 (остаток) | 2,5 + 0,5 | 2,0 + 1,0 | 1,5 + 1,05 | 1,45 + 1,1 — 9 планок, остаток 1,4; стыков посреди участков 6 (в версии 1 — 9 − 1 = 8)",
      },
    },
    {
      name: "Two doors",
      input: { lengthMm: 4000, widthMm: 3000, openings: [door(800, 2)] },
      expected: {
        items: {
          plinth: { packs: 6, need: 12.4, leftover: 2.6 },
          "plinth-cap": { packs: 4 },
          "plinth-joiner": { packs: 4 },
        },
      },
      source: {
        kind: "manual",
        ref: `${REVIEW}. 14 − 1,6 = 12,4 / 2,5 = 4,96 → 5 планок, но остаётся 10 см — меньше 30 см на ошибку при резке, берём шестую (в версии 1 — 5). Двери не отмечены: стены 4 делятся на 1,6 + 1,6; раскрой 2,5 + 0,5 | 1,6 | 0,4 + 1,2 | 1,3 + 1,7 | 0,8 + 0,8 | 1,6 — стыков 4; две двери — 4 заглушки`,
      },
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
      expected: { items: { plinth: { packs: 3, need: 4.5, leftover: 3 } }, warnings: ["door_wider_than_wall"] },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Дверь 3,5 м шире самой длинной стены 3 м — проверьте размеры; 8 − 3,5 = 4,5. Раскрой по участкам: дверь съедает стену 3 целиком, остаются 3 + 1 + 1 = 5 м: 2,5 + 0,5 | 1,0 | 1,0 из остатков — 2 планки без остатка, запасная третья`,
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
      expected: { items: { "plinth-fastener": { packs: 65 } } },
      source: {
        kind: "datasheet",
        ref: `${MANUAL}. участки 1,9 × 2, 4,3 × 2, 4,6: (7 + 1) × 2 + (15 + 1) × 2 + (16 + 1) = 65`,
      },
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
    {
      name: "Room 2.51 × 2.49 m: no 1 cm pieces — 5 planks, not 4 (v2)",
      input: { lengthMm: 2510, widthMm: 2490, openings: [] },
      expected: {
        items: { plinth: { packs: 5, need: 10, leftover: 2.5 }, "plinth-joiner": { packs: 4 } },
      },
      source: {
        kind: "manual",
        ref: `${REVIEW}; ${MIN_PIECE}. Периметр 10 м = 4 планки ровно, но лентой вышли бы куски по 1 см (2,51 = 2,5 + 0,01). Без кусков короче 30 см: 2,21 + 0,30 | 2,19 (остаток 2,2 укорочен) + 0,30 | 2,20 + 0,31 | 2,19 + 0,30 — 5 планок, последний остаток 2,2 м (всего сверх 10 м — 2,5 м с обрезками); 4 стыка`,
      },
    },
    {
      name: "Room 2.6 × 2.6 m: the 10 cm tail is cut 30 cm (v2)",
      input: { lengthMm: 2600, widthMm: 2600, openings: [] },
      expected: { items: { plinth: { packs: 5, need: 10.4, leftover: 2.1 }, "plinth-joiner": { packs: 4 } } },
      source: {
        kind: "manual",
        ref: `${REVIEW}; ${MIN_PIECE}. 10,4 / 2,5 → 5. Лентой: 2,5 + 0,1 | 2,4 + 0,2 | 2,3 + 0,3 | 2,2 + 0,4 — куски 10 и 20 см. По плану: 2,3 + 0,3 | 2,2 + 0,4 | 2,1 + 0,5 | 2,0 + 0,6 — те же 5 планок, последний остаток 1,9 м (12,5 − 10,4 = 2,1 с обрезками)`,
      },
    },
    {
      name: "Room 5 × 5 m without doors: 4 joiners, not 7; a spare plank (v2)",
      input: { lengthMm: 5000, widthMm: 5000, openings: [] },
      expected: {
        items: {
          plinth: { packs: 9, need: 20, leftover: 2.5 },
          "plinth-joiner": { packs: 4 },
          "plinth-corner-in": { packs: 4 },
        },
      },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Каждая стена 5 м = 2 планки по 2,5, стык посередине: 4 соединителя; планка, что кончается в углу, соединителя не требует (в версии 1 — 8 − 1 = 7). 20 / 2,5 = 8 ровно, остаток 0 — девятая планка про запас`,
      },
    },
    {
      name: "Door right at a corner: that corner needs no corner piece (v2)",
      input: {
        lengthMm: 4000,
        widthMm: 3000,
        openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 0 }] }],
      },
      expected: {
        items: {
          plinth: { packs: 6, need: 13.2, leftover: 1.8 },
          "plinth-corner-in": { packs: 3 },
          "plinth-cap": { packs: 2 },
          "plinth-joiner": { packs: 5 },
        },
      },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Дверь 0,8 м на стене 3 от её первого угла: между стенами 2 и 3 плинтус не сходится — 3 внутренних угла (в версии 1 — 4). Участки 4, 3, 3,2, 3: 2,5 + 1,5 | 1,0 + 2,0 | 0,5 + 2,4 + 0,3 | 2,2 + 0,8 — 6 планок, остаток 1,7 м, 5 стыков`,
      },
    },
    {
      name: "Door placed on a wall narrower than it: warning against its own wall (v2)",
      input: {
        lengthMm: 3000,
        widthMm: 1000,
        openings: [{ type: "door", widthMm: 1500, heightMm: 2000, count: 1, places: [{ wall: 1, offsetMm: 0 }] }],
      },
      expected: { items: { plinth: { packs: 3 } }, warnings: ["door_wider_than_wall"] },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Дверь 1,5 м отмечена на стене 2 длиной 1 м — такой двери там нет; в версии 1 сравнивали с самой длинной стеной 3 м и молчали. 8 − 1,5 = 6,5 → 3 планки`,
      },
    },
    {
      name: "Joiners follow the joints: room 0.3 × 1.002 m, plank 2.302 m — one joiner (v2)",
      input: { lengthMm: 300, widthMm: 1002, openings: [], plankLengthMm: 2302 },
      expected: { items: { plinth: { packs: 2 }, "plinth-joiner": { packs: 1 } } },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Участки 1,002 | 0,3 | 1,002 | 0,3: 1,002 из планки 1 (остаток 1,3); 0,3 из остатка (1,0); 1,002 = 1,0 + 0,002 — хвост короче 30 см, остаток режут до 0,702 и берут 0,3 из планки 2 — один стык; 0,3 из остатка. 2 планки, остаток 1,702 ≥ 30 см`,
      },
    },
    {
      name: "Joiners follow the joints: the same room 1.3 m long — no joiner, a spare plank (v2)",
      input: { lengthMm: 1300, widthMm: 1002, openings: [], plankLengthMm: 2302 },
      expected: { items: { plinth: { packs: 3 } }, absentItems: ["plinth-joiner"] },
      source: {
        kind: "manual",
        ref: `${REVIEW}. Участки 1,3 | 1,002 | 1,3 | 1,002: 1,3 + 1,002 = 2,302 — ровно планка на две стены, каждая кончается в углу: стыков посреди стены нет, соединители не нужны, хотя комната больше. Остаток 0 — третья планка про запас`,
      },
    },
    {
      name: "With pack prices: total cost",
      input: { price_plinth: 350 } as Partial<PlintusInput>,
      expected: { costTotal: 2450 },
      source: { kind: "manual", ref: "7 планок × 350 = 2450 ₽; фурнитура без цены" },
    },
  ],
};
