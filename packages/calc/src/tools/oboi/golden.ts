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
 * Hand derivations. Strip = height + 10 cm trim (aligned to the repeat). Full strips = ⌈(perimeter − Σ
 * max(opening width − roll width, 0)) / roll width⌉: a strip that only partly covers an opening is still full
 * height. Pieces: ⌈max(w − roll width, 0) / roll width⌉ per opening, (H − h) + 10 cm above a door, (H − h) + 20 cm
 * above and below a window, none under 5 cm; they go into roll tails first. With a repeat every roll loses
 * up to repeat − 1 mm before the first cut (usable 10,05 − 0,639 = 9,411 m for 64 cm). Need = rolls × roll
 * length − the largest tail; paste = ⌈net wall area / m² per pack⌉.
 */
export const golden: GoldenFile<OboiInput> = {
  tool: "oboi",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 × 2.7 m, door and window, roll 0.53 × 10.05 m (defaults)",
      input: {},
      expected: {
        items: {
          wallpaper: { packs: 11, need: 106.1, leftover: 4.45 },
          "wallpaper-glue": { packs: 2, need: 44.78 },
        },
        summary: { strips: 32, stripLength: 2.8, perRoll: 3, pieces: 3, wallArea: 44.78 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${TRIM}. P = 17,8; дверь экономит 0,8 − 0,53 = 0,27, окно 1,2 − 0,53 = 0,67; (17,8 − 0,94) / 0,53 = 31,8 → 32 полосы по 2,8 м; 3 из рулона, хвост 1,65; 32 → 11 рулонов (в 11-м 2 полосы, хвост 4,45). Куски: окно 2 × (1,3 + 0,2) = 1,5, дверь 1 × 0,8 — в хвостах рулонов 1–3. 110,55 − 4,45 = 106,1 м. Клей 44,78 / 30 → 2`,
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
        items: { wallpaper: { packs: 6, need: 55.85, leftover: 4.45 } },
        summary: { strips: 17, perRoll: 3, pieces: 1 },
      },
      source: {
        kind: "manual",
        ref: "Дверь 0,8 уже рулона 1,06 — полосу не экономит; окно экономит 1,2 − 1,06 = 0,14. (17,8 − 0,14) / 1,06 = 16,7 → 17 полос; 3 из рулона → 6 рулонов (в 6-м 2 полосы, хвост 4,45). Кусок над/под окном 1,5 — в хвост рулона 1. 60,3 − 4,45 = 55,85 м",
      },
    },
    {
      name: "Straight match, repeat 64 cm: pieces need an extra roll",
      input: { repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 12, need: 112.689, leftover: 7.911 } },
        summary: { strips: 32, stripLength: 3.2, perRoll: 3, pieces: 3 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411; полосы 0–2,8, 3,2–6,0, 6,4–9,2, хвост 0,211. 32 полосы → 11 рулонов, в 11-м 2 полосы (до 6,0). Куски с начала кратно 0,64: 1,5 в рулон 11 (6,4–7,9), второй 1,5 не входит (8,32 + 1,5 > 9,411) → рулон 12 (0–1,5), 0,8 в рулон 11 (8,32–9,12). Хвосты: 0,211 × 10, 0,291, 7,911. 120,6 − 7,911 = 112,689 м",
      },
    },
    {
      name: "Offset match, repeat 64 cm",
      input: { repeatMm: 640, match: "offset" },
      expected: {
        items: { wallpaper: { packs: 12, need: 111.989, leftover: 8.611 } },
        summary: { strips: 32, perRoll: 3 },
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411, фазы 0 и 0,32 по очереди. Каждый рулон в своей системе отсчёта: 0–2,8, 2,88–5,68, 5,76–8,56 (новый рулон начинается сразу с нужной фазы — запас на подгонку уже это покрывает). 30 полос в 10 рулонах, 31-я и 32-я — в 11-м (0–2,8, 2,88–5,68). Куски 1,5: в рулон 11 с 5,76 и с 7,36 (до 8,86); 0,8 никуда не входит (8,64 + 0,8 > 9,411) → рулон 12. 120,6 − 8,611 = 111,989 м",
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
        warnings: ["roll_tight"],
      },
      source: {
        kind: "manual",
        ref: "8,48 / 0,53 = 16 ровно; полоса 3,25 + 0,1 = 3,35, 3 × 3,35 = 10,05 — рулон без остатка; 16 / 3 → 6 рулонов, в последнем 1 полоса, хвост 6,7; 60,3 − 6,7 = 53,6 м. Рулон короче на допуск ГОСТ 6810 (±1,5%) даст 2 полосы — предупреждение",
      },
    },
    {
      name: "Door taller than the wall: warning, no piece above it",
      input: { lengthMm: 4000, widthMm: 3000, openings: [door(900, 2800)] },
      expected: {
        items: {
          wallpaper: { packs: 9, need: 86, leftover: 4.45 },
          "wallpaper-glue": { packs: 2, need: 35.28 },
        },
        summary: { strips: 26, pieces: 0 },
        warnings: ["opening_too_tall"],
      },
      source: {
        kind: "manual",
        ref: "(14 − (0,9 − 0,53)) / 0,53 = 25,7 → 26 полос; 3 из рулона → 9 рулонов, в последнем 2 полосы, хвост 4,45; 90,45 − 4,45 = 86 м. Над дверью высотой 2,8 м куска нет. Стены 37,8 − 2,52 = 35,28 м²",
      },
    },
    {
      name: "Two doors, roll tails take both pieces",
      input: { lengthMm: 3500, widthMm: 3200, heightMm: 2600, openings: [door(800, 2000, 2)] },
      expected: {
        items: {
          wallpaper: { packs: 9, need: 83.1, leftover: 7.35 },
          "wallpaper-glue": { packs: 2, need: 31.64 },
        },
        summary: { strips: 25, stripLength: 2.7, pieces: 2 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "(13,4 − 2 × 0,27) / 0,53 = 24,3 → 25 полос по 2,7; 3 из рулона, хвост 1,95 → 9 рулонов (в последнем 1 полоса, хвост 7,35). 2 куска по 0,6 + 0,1 = 0,7 — оба в хвост рулона 1. 90,45 − 7,35 = 83,1 м; стены 34,84 − 3,2 = 31,64 м²",
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
      name: "A door narrower than the roll saves no strip",
      input: { lengthMm: 2000, widthMm: 3000, rollWidthMm: 1060, openings: [door(800, 2000)] },
      expected: {
        items: { wallpaper: { packs: 4, need: 32.95, leftover: 7.25 } },
        summary: { strips: 10, pieces: 0 },
      },
      source: {
        kind: "manual",
        ref: "Полоса 1,06 шире двери 0,8 — всё равно идёт во всю высоту. 10 / 1,06 = 9,4 → 10 полос; 3 из рулона → 4 рулона, в последнем 1 полоса, хвост 7,25; 40,2 − 7,25 = 32,95 м",
      },
    },
    {
      name: "A 1 cm gap above a door gives no piece",
      input: { lengthMm: 2520, widthMm: 1720, heightMm: 3000, trimMm: 0, openings: [door(1200, 2990)] },
      expected: {
        items: { wallpaper: { packs: 5, need: 49.2, leftover: 1.05 } },
        summary: { strips: 15, pieces: 0 },
      },
      source: {
        kind: "manual",
        ref: "(8,48 − 0,67) / 0,53 = 14,7 → 15 полос по 3 м (припуск 0); 3 из рулона, хвост 1,05 → 5 рулонов. Над дверью 1 см — его закрывает наличник, кусок не нужен. 50,25 − 1,05 = 49,2 м",
      },
    },
    {
      name: "Window piece longer than the roll: warning names the piece",
      input: { heightMm: 9800, trimMm: 250, openings: [window(600, 100)] },
      expected: { absentItems: ["wallpaper"], warnings: ["piece_longer_than_roll"] },
      source: {
        kind: "manual",
        ref: "Полоса 9,8 + 0,25 = 10,05 — входит в рулон; кусок над и под окном 9,7 + 0,5 = 10,2 м длиннее рулона 10,05",
      },
    },
    {
      name: "Height 3 m with a 64 cm repeat: the worst roll start leaves 2 strips per roll",
      input: { heightMm: 3000, repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 16, need: 157.689, leftover: 3.111 } },
        summary: { strips: 32, stripLength: 3.2, perRoll: 2, pieces: 3 },
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411; полосы 3,1: 0–3,1, 3,2–6,3; третья 6,4 + 3,1 = 9,5 не входит → 2 из рулона (правило мастеров: 10,05 / (3,1 + 0,64) → 2). 32 / 2 = 16 рулонов, хвост 3,111; куски над и под окном 1,8, 1,8 и над дверью 3,0 − 2,0 + 0,1 = 1,1 — в хвосты рулонов 1–3. 160,8 − 3,111 = 157,689 м",
      },
    },
    {
      name: "Offset match, repeat 50 cm, height 2.8 m: every roll gives 3 strips",
      input: { heightMm: 2800, repeatMm: 500, match: "offset" },
      expected: {
        items: { wallpaper: { packs: 12, need: 112.649, leftover: 7.951 } },
        summary: { strips: 32, perRoll: 3, pieces: 3 },
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 10,05 − 0,499 = 9,551; полоса 2,9: 0–2,9, 3,25–6,15, 6,5–9,4 в каждом рулоне. 32 полосы → 11 рулонов (в 11-м 2 полосы до 6,15). Куски 1,6 (окно): в рулон 11 с 6,25 до 7,85, второй не входит (8,0 + 1,6 > 9,551) → рулон 12; 0,9 (дверь) — в рулон 11 с 8,0 до 8,9. 120,6 − 7,951 = 112,649 м (повторный review: раньше рулоны со смещённой фазой теряли ещё полраппорта)",
      },
    },
    {
      name: "Straight match 64 cm, height 2.9 m: strips use the roll almost to the end",
      input: { heightMm: 2900, repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 12, need: 112.889, leftover: 7.711 } },
        summary: { perRoll: 3 },
        warnings: ["roll_tight"],
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411; полосы 3,0: 0–3,0, 3,2–6,2, 6,4–9,4 — остаётся 0,011 м, меньше 1,5% рулона. 32 полосы → 11 рулонов; куски 1,7 (окно) в рулон 11 с 6,4 и рулон 12; 1,0 (дверь) в рулон 11 с 8,32. 120,6 − 7,711 = 112,889 м",
      },
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
        "Same 11 rolls. Qalculator subtracts the full door width and none of the window (33 strips); we subtract from each opening only the width a whole strip can be left out of, w − 0,53 (32 strips), and cut the pieces above and below from roll tails. Their formula with zapas 0; the UI applies the user's extra %.",
    },
    {
      example: "Straight match, repeat 64 cm: pieces need an extra roll",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka.js",
      checkedAt: "2026-10-09",
      observed: { items: { wallpaper: { packs: 11 } }, summary: { stripLength: 3.2, perRoll: 3 } },
      explanation:
        "Qalculator 11, we 12. Both give 3 strips per roll, but we also allow for the unknown pattern start on each roll (up to 0,639 m lost), which leaves 0,211 m tails: the pieces above and below the window and door no longer fit and take a 12th roll. Qalculator glues full strips over the window instead of pieces.",
    },
    {
      example: "Offset match, repeat 64 cm",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka.js",
      checkedAt: "2026-10-09",
      observed: { items: { wallpaper: { packs: 17 } }, summary: { perRoll: 2 } },
      explanation:
        "Qalculator adds half a repeat to every strip (3,2 + 0,32 = 3,52 → 2 per roll → 17 rolls). In a real cut only every second strip shifts by half a repeat: 0–2,8, 2,88–5,68, 5,76–8,56 m fit in 9,411 m even after the worst pattern start, so a roll gives 3 strips: 32 strips in 11 rolls plus one roll for the pieces = 12.",
    },
  ],
};
