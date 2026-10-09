import type { GoldenFile } from "../../golden";
import type { OboiInput } from "./index";

type Opening = OboiInput["openings"][number];
const door = (widthMm: number, heightMm: number, count = 1): Opening => ({ type: "door", widthMm, heightMm, count });
const window = (widthMm: number, heightMm: number, count = 1): Opening => ({
  type: "window",
  widthMm,
  heightMm,
  count,
});

const TRIM = "Припуск 4–5 см сверху и снизу: инструкция ARTSIMPLE (SURGAZ), https://artsimple.ru/instruction";

/**
 * Hand derivations. Strip = height + 10 cm trim (aligned to the repeat). Full strips = ⌈(perimeter − opening
 * widths) / roll width⌉. Pieces: ⌈opening width / roll width⌉ per opening, (H − h) + 10 cm above a door,
 * (H − h) + 20 cm above and below a window; they go into roll tails first. Need = rolls × roll length − the
 * largest tail; paste = ⌈net wall area / m² per pack⌉.
 */
export const golden: GoldenFile<OboiInput> = {
  tool: "oboi",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 × 2.7 m, door and window, roll 0.53 × 10.05 m (defaults)",
      input: {},
      expected: {
        items: {
          wallpaper: { packs: 10, need: 98.85, leftover: 1.65 },
          "wallpaper-glue": { packs: 2, need: 44.78 },
        },
        summary: { strips: 30, stripLength: 2.8, perRoll: 3, pieces: 5, wallArea: 44.78 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${TRIM}. P = 17,8; 17,8 − 0,8 − 1,2 = 15,8 / 0,53 = 29,8 → 30 полос по 2,8 м; 10,05 / 2,8 → 3 полосы, хвост 1,65; 30 / 3 = 10 рулонов. Куски: окно 3 × (1,3 + 0,2) = 1,5 м, дверь 2 × (0,7 + 0,1) = 0,8 м — все в хвостах 1,65 м. Клей 44,78 / 30 → 2`,
      },
    },
    {
      name: "No openings 3 × 3 × 2.5 m, paste exactly one pack",
      input: { lengthMm: 3000, widthMm: 3000, heightMm: 2500, openings: [] },
      expected: {
        items: {
          wallpaper: { packs: 8, need: 75.55, leftover: 4.85 },
          "wallpaper-glue": { packs: 1, need: 30, leftover: 0 },
        },
        summary: { strips: 23, stripLength: 2.6, perRoll: 3, pieces: 0 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "12 / 0,53 = 22,6 → 23 полосы по 2,6 м; 3 из рулона; 23 / 3 → 8 рулонов, в последнем 2 полосы, хвост 10,05 − 5,2 = 4,85; 8 × 10,05 − 4,85 = 75,55 м. Стены 30 м², клей 30 / 30 = 1 пачка",
      },
    },
    {
      name: "Wide roll 1.06 × 10.05 m, mockup room",
      input: { rollWidthMm: 1060 },
      expected: {
        items: { wallpaper: { packs: 5, need: 48.6, leftover: 1.65 } },
        summary: { strips: 15, perRoll: 3, pieces: 3 },
      },
      source: {
        kind: "manual",
        ref: "15,8 / 1,06 = 14,9 → 15 полос; 3 из рулона → 5 рулонов, хвосты по 1,65. Куски: окно 2 × 1,5, дверь 1 × 0,8 — в хвостах рулонов 1–3. 5 × 10,05 − 1,65 = 48,6 м",
      },
    },
    {
      name: "Straight match, repeat 64 cm: pieces need an extra roll",
      input: { repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 11, need: 108.34, leftover: 2.21 } },
        summary: { strips: 30, stripLength: 3.2, perRoll: 3, pieces: 5 },
      },
      source: {
        kind: "manual",
        ref: "Полоса 2,8 → начало каждой кратно 0,64: 0–2,8, 3,2–6,0, 6,4–9,2; хвост 0,85 — куски 1,5 и 0,8 (начало с 9,6) не входят. 30 полос = 10 рулонов, куски в 11-м: 0–1,5, 1,92–3,42, 3,84–5,34, 5,76–6,56, 7,04–7,84, хвост 2,21. 11 × 10,05 − 2,21 = 108,34 м",
      },
    },
    {
      name: "Offset match, repeat 64 cm",
      input: { repeatMm: 640, match: "offset" },
      expected: {
        items: { wallpaper: { packs: 11, need: 105.2, leftover: 5.35 } },
        summary: { strips: 30, perRoll: 3 },
      },
      source: {
        kind: "manual",
        ref: "Фазы 0 и 0,32 по очереди. Нечётные рулоны: 0–2,8, 2,88–5,68, 5,76–8,56; чётные начинаются с 0,32: 0,32–3,12, 3,2–6,0, 6,08–8,88. 10 рулонов на 30 полос. Куски 1,5 × 3 — в 11-м рулоне: 0–1,5, 1,6–3,1, 3,2–4,7; дверь 0,8: рулон 1 с 8,64 до 9,44, рулон 2 с 8,96 до 9,76. Наибольший хвост 10,05 − 4,7 = 5,35; 110,55 − 5,35 = 105,2 м",
      },
    },
    {
      name: "Roll 1.06 × 25 m, room 5 × 4 × 2.7 m without openings",
      input: { lengthMm: 5000, widthMm: 4000, rollWidthMm: 1060, rollLengthMm: 25_000, openings: [] },
      expected: {
        items: {
          wallpaper: { packs: 3, need: 52.8, leftover: 22.2 },
          "wallpaper-glue": { packs: 2, need: 48.6 },
        },
        summary: { strips: 17, perRoll: 8 },
      },
      source: {
        kind: "manual",
        ref: "18 / 1,06 = 16,98 → 17 полос; 25 / 2,8 → 8 из рулона; 17 / 8 → 3 рулона, в третьем 1 полоса, хвост 22,2; 75 − 22,2 = 52,8 м. Клей 48,6 / 30 → 2",
      },
    },
    {
      name: "Strips fill the roll exactly and the perimeter is a whole number of strips",
      input: { lengthMm: 2120, widthMm: 2120, heightMm: 3250, openings: [] },
      expected: {
        items: {
          wallpaper: { packs: 6, need: 53.6, leftover: 6.7 },
          "wallpaper-glue": { packs: 1, need: 27.56 },
        },
        summary: { strips: 16, stripLength: 3.35, perRoll: 3 },
      },
      source: {
        kind: "manual",
        ref: "8,48 / 0,53 = 16 ровно; полоса 3,25 + 0,1 = 3,35, 3 × 3,35 = 10,05 — рулон без остатка; 16 / 3 → 6 рулонов, в последнем 1 полоса, хвост 6,7; 60,3 − 6,7 = 53,6 м",
      },
    },
    {
      name: "Door taller than the wall: warning, no piece above it",
      input: { lengthMm: 4000, widthMm: 3000, openings: [door(900, 2800)] },
      expected: {
        items: {
          wallpaper: { packs: 9, need: 83.2, leftover: 7.25 },
          "wallpaper-glue": { packs: 2, need: 35.28 },
        },
        summary: { strips: 25, pieces: 0 },
        warnings: ["opening_too_tall"],
      },
      source: {
        kind: "manual",
        ref: "14 − 0,9 = 13,1 / 0,53 = 24,7 → 25 полос; 3 из рулона → 9 рулонов, в последнем 1 полоса, хвост 7,25; 90,45 − 7,25 = 83,2 м. Над дверью высотой 2,8 м куска нет. Стены 37,8 − 2,52 = 35,28 м²",
      },
    },
    {
      name: "Two doors, roll tails take all four pieces",
      input: { lengthMm: 3500, widthMm: 3200, heightMm: 2600, openings: [door(800, 2000, 2)] },
      expected: {
        items: {
          wallpaper: { packs: 8, need: 75.75, leftover: 4.65 },
          "wallpaper-glue": { packs: 2, need: 31.64 },
        },
        summary: { strips: 23, stripLength: 2.7, pieces: 4 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "13,4 − 1,6 = 11,8 / 0,53 = 22,3 → 23 полосы по 2,7; 3 из рулона, хвост 1,95 → 8 рулонов (в последнем 2 полосы, хвост 4,65). 4 куска по 0,6 + 0,1 = 0,7: по два в хвосты рулонов 1 и 2. 80,4 − 4,65 = 75,75 м; стены 34,84 − 3,2 = 31,64 м²",
      },
    },
    {
      name: "Ceiling higher than the roll: warning, no wallpaper line",
      input: { lengthMm: 4000, widthMm: 4000, heightMm: 10_000, openings: [] },
      expected: {
        items: { "wallpaper-glue": { packs: 6, need: 160 } },
        absentItems: ["wallpaper"],
        warnings: ["strip_longer_than_roll"],
      },
      source: {
        kind: "manual",
        ref: "Полоса 10 + 0,1 = 10,1 м длиннее рулона 10,05 м. Клей 16 × 10 = 160 / 30 = 5,3 → 6",
      },
    },
    {
      name: "Openings larger than the walls: warning, nothing to buy",
      input: { lengthMm: 1000, widthMm: 1000, heightMm: 2500, openings: [window(5000, 2000, 2)] },
      expected: { absentItems: ["wallpaper", "wallpaper-glue"], warnings: ["openings_exceed_walls"] },
      source: { kind: "manual", ref: "Стены 4 × 2,5 = 10 м², окна 2 × 5 × 2 = 20 м² — оклеивать нечего" },
    },
    {
      name: "Paste pack for 50 m²",
      input: { pasteCoverageM2: 50 },
      expected: { items: { "wallpaper-glue": { packs: 1, need: 44.78, leftover: 5.22 } } },
      source: {
        kind: "datasheet",
        ref: "Пачка на 50 м² (тяжёлые флизелиновые, по этикетке): 44,78 / 50 → 1, останется на 5,22 м²",
      },
    },
  ],
  benchmarks: [
    {
      example: "Mockup room 4.6 × 4.3 × 2.7 m, door and window, roll 0.53 × 10.05 m (defaults)",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka.js",
      checkedAt: "2026-10-09",
      observed: { items: { wallpaper: { packs: 11 } }, summary: { strips: 33 } },
      explanation:
        "Qalculator subtracts only door widths (17,8 − 0,8 = 17 / 0,53 → 33 strips) and glues full strips over the window. We subtract the window too and cut the 3 pieces above and below it from the 1,65 m roll tails: 30 strips → 10 rolls. Their formula with zapas 0; the UI applies the user's extra %.",
    },
    {
      example: "Straight match, repeat 64 cm: pieces need an extra roll",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka.js",
      checkedAt: "2026-10-09",
      observed: { items: { wallpaper: { packs: 11 } }, summary: { stripLength: 3.2, perRoll: 3 } },
      explanation:
        "Same 11 rolls by a different route: Qalculator has 33 full strips / 3 per roll; we have 30 strips in 10 rolls plus a roll for the pieces, which no longer fit the 0,85 m tails once each must start on the repeat.",
    },
    {
      example: "Offset match, repeat 64 cm",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka.js",
      checkedAt: "2026-10-09",
      observed: { items: { wallpaper: { packs: 17 } }, summary: { perRoll: 2 } },
      explanation:
        "Qalculator adds half a repeat to every strip (3,2 + 0,32 = 3,52 → 2 per roll → 17 rolls). In a real cut only every second strip shifts by half a repeat: 0–2,8, 2,88–5,68, 5,76–8,56 m, so a roll still gives 3 strips and 11 rolls are enough.",
    },
  ],
};
