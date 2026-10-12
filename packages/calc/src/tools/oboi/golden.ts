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

const CORNER =
  "Заход в угол 10–15 мм, следующую полосу — внахлёст по уровню, начинают от окна: РБК Недвижимость, https://realty.rbc.ru/news/69f326cb9a7947ef7f415a11; заворот 1,5–5 см: https://oboi-store.ru/blog/post/kak-kleit-oboi-v-uglax";

/** The example openings without places on the plan: the perimeter estimate (version 1). */
const UNPLACED = { openings: [door(800, 2000), window(1200, 1400)] };

const TRIM = "Припуск 4–5 см сверху и снизу: инструкция ARTSIMPLE (SURGAZ), https://artsimple.ru/instruction";

/**
 * Hand derivations. Strip = height + 10 cm trim (aligned to the repeat). Full strips = ⌈(perimeter − Σ
 * max(opening width − roll width, 0)) / roll width⌉: a strip that only partly covers an opening is still full
 * height. Pieces: ⌈max(w − roll width, 0) / roll width⌉ per opening, (H − h) + 10 cm above a door, (H − h) + 20 cm
 * above and below a window, none under 5 cm; they go into roll tails first. With a repeat every roll loses
 * up to repeat − 1 mm before the first cut (usable 10,05 − 0,639 = 9,411 m for 64 cm). Need = rolls × roll
 * length − the largest tail; paste = ⌈net wall area / m² per pack⌉.
 *
 * Version 2, every door and window placed (or none): strips are hung wall by wall from the first corner of the
 * window wall, clockwise. The first strip wraps 1,5 cm onto the last wall (its edge at roll width − 1,5 cm from
 * the corner); a strip across a corner is cut so it wraps 1,5 cm onto the next wall, and its rest (≥ 5 cm) goes
 * on the next wall from the corner; the last wall ends 1,5 cm short. A strip wholly across an opening becomes
 * pieces: above it (y + 10 cm) and, for a window, below it (sill + 10 cm); default sill 90 cm.
 *
 * Version 3: the start is chosen — a level line on some wall, strips clockwise from it to the closing corner and
 * anticlockwise back to it, so the last joint is in the least visible corner (by the door). Every corner takes a
 * 1,5 cm wrap (3 cm outer); a strip ending right at a corner makes the next wall's first strip wrap back. The two
 * closing strips are narrow: without a pattern they are cut from any rest wide and long enough (side by side),
 * with a pattern from one strip when they fit (left and right side) at the same phase. Pieces go into rests:
 * roll tails and side rests, each used once. Derivations below follow the chosen start; a lower bound shows the
 * roll count is the least possible for that hang.
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
          primer: { packs: 1, need: 6.717, leftover: 3.283 },
        },
        summary: {
          strips: 33,
          stripLength: 2.8,
          perRoll: 3,
          pieces: 3,
          wallArea: 44.78,
          rollsUsed: 11,
          blanks: 33,
          parts: 39,
        },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${TRIM}. ${CORNER}. Версия 3. Старт: стена 1, линия в 20 см от левого угла; стык — в углу стен 2 и 3 у двери. По часовой: полосы 1–8 (0,2–4,44), 9-я в углу: 16 см + 1,5 на стену 2, остаток 53 − 16 − 1,5 = 35,5 см → стена 2 (0–0,355); стена 2: 10–16 (до 4,065), 17-я замыкающая 22 см (до 4,285 — дальше заход с другой стороны). Против часовой: 18-я — 20 см на стене 1 + 1,5 на стену 4, остаток 31,5 см → стена 4 (3,985–4,3); стена 4: 19–21, К1 на окне (1,865–2,395 внутри 1,57–2,73), 22–24, 25-я в углу 27,5 + 1,5, остаток 24 см → стена 3 (4,36–4,6); стена 3: 26–31, К2 над дверью (0,65–1,18 внутри 0,6–1,4), 32-я, 33-я замыкающая 12 + 1,5 = 13,5 см. Полосы 2,8 м: 31 во всю ширину + 2 узкие (22 и 13,5 см — из одного остатка рядом). 3 из рулона → 31 полоса в 10 рулонах и 1 в 11-м; узкие — в 11-м после неё; куски: под окном 1,0 и над ним 0,5 — в хвост рулона 1 (1,65 → 0,15), над дверью 0,8 — в хвост рулона 2. 11 рулонов (31 полоса — меньше нельзя), хвост 11-го 10,05 − 5,6 = 4,45: 110,55 − 4,45 = 106,1 м. Клей 44,78 / 30 → 2. Грунт 44,78 × 0,15 = 6,717 л → 1 канистра 10 л (Ceresit CT 17 PRO)`,
      },
    },
    {
      name: "Same room, door and window not placed: the perimeter estimate (v1)",
      input: UNPLACED,
      expected: {
        items: { wallpaper: { packs: 11, need: 106.1, leftover: 4.45 } },
        summary: { strips: 32, pieces: 3 },
      },
      source: {
        kind: "manual",
        ref: `${TRIM}. P = 17,8; дверь экономит 0,8 − 0,53 = 0,27, окно 1,2 − 0,53 = 0,67; (17,8 − 0,94) / 0,53 = 31,8 → 32 полосы по 2,8 м; 3 из рулона, хвост 1,65; 32 → 11 рулонов (в 11-м 2 полосы, хвост 4,45). Куски: окно 2 × (1,3 + 0,2) = 1,5, дверь 1 × 0,8 — в хвостах рулонов 1–3. 110,55 − 4,45 = 106,1 м. Клей 44,78 / 30 → 2. Грунт под обои 44,78 × 0,15 = 6,717 л → 1 канистра 10 л (Ceresit CT 17 PRO: 0,1–0,2 л/м²)`,
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
        warnings: ["narrow_insert"],
      },
      source: {
        kind: "manual",
        ref: "Периметр 12 + заходы в 4 угла по 1,5 см = 12,06 м / 0,53 = 22,8 → не меньше 23 полос по 2,6 м; 3 из рулона → 8 рулонов (7 × 3 = 21 и 2 узкие замыкающие в 8-м). Выбранный старт: стена 1, линия 25 см, стык в углу 2–3: 23 полосы, одна вставка уже 10 см (остаток 8,5 см у угла стены 4) — дешевле без неё не выходит, отсюда подсказка. 8 × 10,05 − 4,85 = 75,55 м. Стены 30 м², клей 30 / 30 = 1 пачка",
      },
    },
    {
      name: "Wide roll 1.06 × 10.05 m, mockup room",
      input: { rollWidthMm: 1060 },
      expected: {
        items: { wallpaper: { packs: 6, need: 53.05, leftover: 7.25 } },
        summary: { strips: 16, perRoll: 3, pieces: 2, blanks: 16, fromRests: 2 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. Старт: стена 1, линия 50 см, стык в углу 2–3. По часовой: 1–3, 4-я в углу 92 + 1,5, остаток 12,5 см → стена 2; 5–7, 8-я замыкающая 98 см. Против часовой: 9-я — 50 см на стене 1 + 1,5, остаток 54,5 → стена 4; 10, К1 на окне (1,635–2,695 внутри 1,57–2,73), 11, 12-я в углу 57,5 + 1,5 = 59, остаток 47 → стена 3; 13–15, 16-я замыкающая 95 + 1,5 = 96,5 см. 14 полос во всю ширину + 2 узкие (98 и 96,5 — вместе шире рулона, из одной не выйдут) = 16 отрезов по 2,8 м; 3 из рулона → 6 рулонов (меньше 16 / 3 нельзя). Узкая 98 — в хвост 5-го рулона после двух полос; 96,5 — 6-й рулон; куски 1,0 и 0,5 — в хвост рулона 1. Хвост 6-го 10,05 − 2,8 = 7,25: 60,3 − 7,25 = 53,05 м. В версии 2 было 17 полос и 6 рулонов (55,85 м)`,
      },
    },
    {
      name: "Straight match, repeat 64 cm: pieces need an extra roll",
      input: { repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 12, need: 111.689, leftover: 8.911 } },
        summary: { strips: 33, stripLength: 3.2, perRoll: 3, pieces: 3, blanks: 32 },
        warnings: ["repeat_lucky_start"],
      },
      source: {
        kind: "manual",
        ref: "Раскладка как в примере по умолчанию: 31 полоса во всю ширину, 2 замыкающие (22 и 13,5 см) — с рисунком они вырезаются из одной полосы (левый край и правый, фаза одна), итого 32 отреза; куски: под окном 1,0 (фаза 1,8 mod 0,64 = 0,52), над окном 0,5 и над дверью 0,8 (фаза 0). Рабочая длина 9,411; полосы 0–2,8, 3,2–6,0, 6,4–9,2, хвост 0,211. 32 отреза → 10 рулонов по 3 и 2 в 11-м (до 6,0). Куски: 1,0 — в рулон 11 с 6,28 (до 7,28), 0,8 — с 7,68 (до 8,48); 0,5 с фазой 0 — с 8,96 не входит → рулон 12 (0–0,5). Хвост 12-го 9,411 − 0,5 = 8,911: 120,6 − 8,911 = 111,689 м. При удачном начале рисунка хватило бы 11 — подсказка",
      },
    },
    {
      name: "Offset match, repeat 64 cm: the short pieces fit the tails",
      input: { repeatMm: 640, match: "offset" },
      expected: {
        items: { wallpaper: { packs: 11, need: 109.299, leftover: 1.251 } },
        summary: { strips: 33, perRoll: 3, pieces: 3 },
      },
      source: {
        kind: "manual",
        ref: "Раскладка как в примере по умолчанию (31 + 2 замыкающие, 3 куска). Фазы 0 и 0,32 по очереди по порядку поклейки; замыкающие 17-я и 33-я одной фазы → одна полоса на двоих: 32 отреза. Рабочая длина 9,411; в рулоне 0–2,8, 2,88–5,68, 5,76–8,56 → 10 рулонов по 3 и 2 в 11-м (до 6,0 с подгонкой). Куски: 0,5 над окном — в хвост рулона 1 с 8,64; 1,0 под окном и 0,8 над дверью — в рулон 11 с 6,28 и 7,36 (до 8,16). Самый большой хвост 9,411 − 8,16 = 1,251: 110,55 − 1,251 = 109,299 м. В версии 1 куски 1,5 и 0,8 не помещались — 12 рулонов",
      },
    },
    {
      name: "Roll 1.06 × 25 m, room 5 × 4 × 2.7 m without openings",
      input: { lengthMm: 5000, widthMm: 4000, rollWidthMm: 1060, rollLengthMm: 25_000, openings: [] },
      expected: {
        items: {
          wallpaper: { packs: 3, need: 55.6, leftover: 19.4 },
          "wallpaper-glue": { packs: 2, need: 48.6 },
        },
        summary: { strips: 18, perRoll: 8 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. По периметру 18 / 1,06 = 16,98 → 17, но заходы в углы (4 × 1,5 см) не помещаются: стена 1 с −0,015: 5 полос, в углу 77,5 см, остаток 27; стена 2 с 0,27: 4, угол 55, остаток 49,5; стена 3 с 0,495: 5, угол 26,5, остаток 78; стена 4 (до 3,985) с 0,78: 4, последняя с 3,96 в углу 4 см. 18 полос; 25 / 2,8 → 8 из рулона; 18 / 8 → 3 рулона, в третьем 2 полосы, хвост 25 − 5,6 = 19,4; 75 − 19,4 = 55,6 м. Клей 48,6 / 30 → 2`,
      },
    },
    {
      name: "Strips fill the roll exactly and the perimeter is a whole number of strips",
      input: { lengthMm: 2120, widthMm: 2120, heightMm: 3250, openings: [] },
      expected: {
        items: {
          wallpaper: { packs: 6, need: 56.95, leftover: 3.35 },
          "wallpaper-glue": { packs: 1, need: 27.56 },
        },
        summary: { strips: 17, stripLength: 3.35, perRoll: 3 },
        warnings: ["roll_tight"],
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. 8,48 / 0,53 = 16 ровно, но без запаса на заходы в углы: стена 1 с −0,015 — 4 полосы до 2,105 и 5-я в углу 1,5 см (остаток 50 см); стены 2–4 с остатков 50, 48,5, 47 см — по 3 полосы и угловая (3, 4,5 и 6 см). 17 полос; полоса 3,25 + 0,1 = 3,35, 3 × 3,35 = 10,05 — рулон без остатка; 17 / 3 → 6 рулонов, в последнем 2 полосы, хвост 3,35; 60,3 − 3,35 = 56,95 м. Рулон короче на допуск ГОСТ 6810 (±1,5%) даст 2 полосы — предупреждение`,
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
        summary: { strips: 33, stripLength: 3.2, perRoll: 2, pieces: 3 },
        warnings: ["repeat_lucky_start"],
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411; полосы 3,1: 0–3,1, 3,2–6,3; третья 6,4 + 3,1 = 9,5 не входит → 2 из рулона (правило мастеров: 10,05 / (3,1 + 0,64) → 2). Раскладка как в примере по умолчанию: 31 полоса + 2 замыкающие из одной = 32 отреза → 16 рулонов, хвост 3,111; куски над дверью 1,1, под окном 1,0, над окном 0,8 — в хвосты рулонов 1 и 2. 160,8 − 3,111 = 157,689 м. При удачном начале рисунка 3 из рулона — подсказка",
      },
    },
    {
      name: "Offset match, repeat 50 cm, height 2.8 m: every roll gives 3 strips",
      input: { heightMm: 2800, repeatMm: 500, match: "offset" },
      expected: {
        items: { wallpaper: { packs: 11, need: 110.099, leftover: 0.451 } },
        summary: { strips: 33, perRoll: 3, pieces: 3 },
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 10,05 − 0,499 = 9,551; полоса 2,9: 0–2,9, 3,25–6,15, 6,5–9,4 в каждом рулоне. Раскладка как в примере по умолчанию: 31 + 2 замыкающие из одной полосы = 32 отреза → 10 рулонов по 3 и 2 в 11-м (0–2,9, 3,0–5,9 — фаза замыкающих). Куски: под окном 1,0, над дверью 0,9, над окном 0,6 — в рулон 11 с 5,9, 7,25 и 8,5 (до 9,1). Хвост 9,551 − 9,1 = 0,451: 110,55 − 0,451 = 110,099 м. В версии 2 было 12 рулонов: замыкающие резались из двух полос",
      },
    },
    {
      name: "Straight match 64 cm, height 2.9 m: strips use the roll almost to the end",
      input: { heightMm: 2900, repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 12, need: 111.889, leftover: 8.711 } },
        summary: { perRoll: 3 },
        warnings: ["repeat_lucky_start", "roll_tight"],
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411; полосы 3,0: 0–3,0, 3,2–6,2, 6,4–9,4 — остаётся 0,011 м, меньше 1,5% рулона. 32 отреза (31 + 2 замыкающие из одной) → 10 рулонов по 3 и 2 в 11-м. Куски: под окном 1,0 (фаза 2,0 mod 0,64 = 0,08) — в рулон 11 с 6,48, над дверью 1,0 (фаза 0) — с 7,68 (до 8,68); над окном 0,7 с 8,96 не входит → рулон 12. Хвост 9,411 − 0,7 = 8,711: 120,6 − 8,711 = 111,889 м",
      },
    },
    {
      name: "A door 1.2 m wide: the strip wholly above it becomes a piece (v2)",
      input: {
        openings: [
          { type: "door", widthMm: 1200, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
          { type: "window", widthMm: 1200, heightMm: 1400, count: 1, places: [{ wall: 3, offsetMm: 1550 }] },
        ],
      },
      expected: {
        items: { wallpaper: { packs: 11, need: 103.3, leftover: 7.25 } },
        summary: { strips: 32, pieces: 4 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. Как в примере по умолчанию, но дверь 0,6–1,8 на стене 3: там целиком над дверью две полосы (0,65–1,18 и 1,18–1,71) → К2, К3, куски по 0,7 + 0,1 = 0,8. 30 полос во всю ширину → 10 рулонов по 3; замыкающие 22 и 13,5 см вырезаются рядом из одного отреза 2,8 м в 11-м рулоне (32 полосы на стенах); куски 1,0 и 0,5 (окно), 0,8 и 0,8 (дверь) — в хвосты 1,65 рулонов 1–3. Хвост 11-го 10,05 − 2,8 = 7,25: 110,55 − 7,25 = 103,3 м`,
      },
    },
    {
      name: "Pattern 70 cm: the piece under the window starts where the pattern is at its height (review)",
      input: {
        heightMm: 2500,
        repeatMm: 700,
        openings: [
          { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 530 }] },
          {
            type: "window",
            widthMm: 1700,
            heightMm: 1400,
            count: 1,
            places: [{ wall: 3, offsetMm: 1500, sillMm: 700 }],
          },
        ],
      },
      expected: {
        items: { wallpaper: { packs: 11, need: 106.599, leftover: 3.951 } },
        summary: { strips: 32, pieces: 5, perRoll: 3 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. formula-reviewer, 2026-10-12. Старт: стена 1, линия 20 см, стык в углу 2–3. Окно 1,5–3,2 на стене 4: целиком на нём полосы 1,865–2,395 и 2,395–2,925 → К1, К2 (над 0,4 + 0,1 = 0,5, под 0,7 + 0,1 = 0,8); дверь 0,6–1,4 на стене 3: 0,65–1,18 → К3 (над 0,5 + 0,1 = 0,6). 30 полос + 2 замыкающие (22 и 13,5 см) из одной = 31 отрез. Рабочая длина 10,05 − 0,699 = 9,351; полоса 2,6, шаг 2,8: 3 из рулона до 8,2 → 10 рулонов и 1 отрез в 11-м. Кусок под окном — фаза 1,8 mod 0,7 = 0,4: в рулон 11 с 3,2 (0,4 + 4 × 0,7) и с 4,6; в хвостах рулонов 1–10 с 8,8 не входит. 0,6 и два 0,5 (фаза 0) — в рулоны 1–3 с 8,4. Хвост 11-го 9,351 − 5,4 = 3,951: 110,55 − 3,951 = 106,599 м`,
      },
    },
    {
      name: "Window sill + height above the ceiling: held under it, warning",
      input: {
        openings: [
          { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
          {
            type: "window",
            widthMm: 1200,
            heightMm: 1400,
            count: 1,
            places: [{ wall: 3, offsetMm: 1550, sillMm: 2000 }],
          },
        ],
      },
      expected: {
        items: { wallpaper: { packs: 11 } },
        summary: { strips: 33, pieces: 2 },
        warnings: ["window_above_ceiling"],
      },
      source: {
        kind: "manual",
        ref: "2,0 + 1,4 = 3,4 > 2,7: окно ставим под потолок (подоконник 1,3). Над ним куска нет, под ним 1,3 + 0,1 = 1,4 у двух полос: 32 полосы и 2 куска, 11 рулонов, предупреждение",
      },
    },
    {
      name: "Owner's room: 4.6 × 4.3 × 2.8 m, roll 1.06 × 10 m, no pattern — 6 rolls, not 5 (scenario A)",
      input: { heightMm: 2800, rollWidthMm: 1060, rollLengthMm: 10_000 },
      expected: {
        items: { wallpaper: { packs: 6, need: 52.9, leftover: 7.1 } },
        summary: { strips: 16, pieces: 2, blanks: 16, fromRests: 2, rollsUsed: 6, parts: 21, wallArea: 46.56 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. Как «Wide roll 1.06», полоса 2,8 + 0,1 = 2,9 м. Стены 17,8 + 4 × 0,015 = 17,86 м, на окне одна полоса не нужна (над и под ней куски): 16,8 м / 1,06 = 15,85 → 16 полос во всю высоту; две замыкающие (98 и 96,5 см) вместе шире рулона — 16 отрезов по 2,9 м. Из рулона 10 м — 3 (8,7, хвост 1,3 на всю ширину), так что 16 / 3 → 6 рулонов; 5 рулонов дают только 15 таких отрезов. Куски 1,0 и 0,6 у окна — в хвосты рулонов 1 и 2. Хвост 6-го 10 − 2,9 = 7,1: 60 − 7,1 = 52,9 м. По площади (46,56 / 10,6 = 4,4 → 5) выходит меньше потому, что хвосты 1,3 м не годятся на полосы во всю высоту`,
      },
    },
    {
      name: "Same room, nothing under the window (scenario B): less area and pieces, the same 6 rolls",
      input: {
        heightMm: 2800,
        rollWidthMm: 1060,
        rollLengthMm: 10_000,
        openings: [
          { type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm: 600 }] },
          {
            type: "window",
            widthMm: 1200,
            heightMm: 1400,
            count: 1,
            places: [{ wall: 3, offsetMm: 1550, bareBelow: true }],
          },
        ],
      },
      expected: {
        items: { wallpaper: { packs: 6, need: 52.9 }, "wallpaper-glue": { packs: 2, need: 45.48 } },
        summary: { strips: 16, pieces: 1, wallArea: 45.48, bareArea: 1.08 },
      },
      source: {
        kind: "manual",
        ref: "Под окном 1,2 × 0,9 = 1,08 м² не клеим: площадь 46,56 − 1,08 = 45,48 м², кусок под окном не нужен (остаётся 0,6 над ним). Полосы во всю высоту те же 16: зона под окном не убирает ни одной — 6 рулонов. Рулон экономит только зона, после которой не нужна целая полоса во всю высоту",
      },
    },
    {
      name: "A wardrobe zone floor to ceiling, 2.2 m: four strips fewer, 10 rolls",
      input: { zones: [{ wall: 0, offsetMm: 1000, fromFloorMm: 0, widthMm: 2200, heightMm: 2700 }] },
      expected: {
        items: { wallpaper: { packs: 10, need: 96.05 } },
        summary: { strips: 29, wallArea: 38.84, bareArea: 5.94 },
      },
      source: {
        kind: "manual",
        ref: "Зона 1,0–3,2 м на стене 1 во всю высоту (2,2 × 2,7 = 5,94 м²): 44,78 − 5,94 = 38,84 м². Старт: стена 4, линия 10 см, стык в углу 2–3; на стене 1 полосы 0–0,53 и 0,53–1,06 (заходит на зону — клеим целиком и подрезаем), четыре полосы 1,06–3,18 целиком в зоне — не клеим, дальше 3,18 и 3,71. 26 полос во всю ширину + 3 узкие: 50,5 см в углу стены 4 (остаток 2,5 см — в отход) и замыкающие 42 и 49 см (вместе шире рулона) = 29. 26 → 9 рулонов (8 × 3 + 2), узкая 50,5 — в хвост 9-го; 42 и 49 — подряд в 10-м. Хвост 10-го 10,05 − 5,6 = 4,45: 100,5 − 4,45 = 96,05 м",
      },
    },
    {
      name: "Manual start: a line 51.5 cm from the corner of wall 1",
      input: { startMode: "manual", startWall: 1, startLineMm: 515 },
      expected: {
        items: { wallpaper: { packs: 11, need: 106.1 } },
        summary: { strips: 32, pieces: 4 },
        warnings: ["narrow_insert"],
      },
      source: {
        kind: "manual",
        ref: "Линию задал пользователь: стена 1, 51,5 см. Стык — в углу 2–3 у двери. На окне две полосы целиком (1,65–2,18 и 2,18–2,71) → К1, К2 (0,5 и 1,0); у угла стены 4 остаётся вставка 6 см — подсказка о узкой вставке. 30 полос во всю ширину + 2 замыкающие (43,5 и 45 см — из разных отрезов) = 32; 30 → 10 рулонов, замыкающие — 11-й рулон. Хвост 11-го 4,45: 110,55 − 4,45 = 106,1 м",
      },
    },
    {
      name: "L-shaped room 4.6 × 4.3 m without 1.5 × 1.2: an outer corner wraps 3 cm",
      input: {
        shape: "l",
        openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 4, offsetMm: 600 }] }],
      },
      expected: {
        items: { wallpaper: { packs: 11, need: 108.9, leftover: 1.65 } },
        summary: { strips: 34, pieces: 1, wallArea: 46.46 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. Наружный угол — заход 3–4 см (Российская газета). Шесть стен: 4,6, 3,1, 1,5, 1,2, 3,1, 4,3 м; наружный угол между стенами 3 и 4: полоса 18 — 12 см на стене 3 + 3 см вокруг угла, остаток 53 − 12 − 3 = 38 см → стена 4. Дверь на стене 5: полоса 0,64–1,17 целиком над ней → К1 (0,7 + 0,1 = 0,8). 32 полосы во всю ширину + замыкающие 27,5 и 12,5 см (рядом из одного отреза) = 34; 32 → 11 рулонов (10 × 3 + 2), узкие — в хвост 11-го, кусок — в хвост рулона 1. Хвост 11-го 10,05 − 8,4 = 1,65: 110,55 − 1,65 = 108,9 м. Площадь 17,8 × 2,7 − 1,6 = 46,46 м²`,
      },
    },
    {
      name: "Symmetric main wall with a 64 cm pattern: a joint in the middle of wall 1",
      input: { repeatMm: 640, symmetric: true },
      expected: {
        items: { wallpaper: { packs: 12, need: 111.689 } },
        summary: { strips: 33, pieces: 3 },
      },
      source: {
        kind: "manual",
        ref: "Главная стена — напротив двери, стена 1 (4,6 м): линия по её середине, 2,3 м, — стык посередине, рисунок симметричен. Дальше как в «Straight match, repeat 64 cm»: 31 + 2 замыкающие из одной полосы = 32 отреза в 11 рулонах, куски 1,0 и 0,8 в хвост 11-го, 0,5 — рулон 12. 12 рулонов, хвост 8,911: 120,6 − 8,911 = 111,689 м",
      },
    },
    {
      name: "Without primer",
      input: { primer: false },
      expected: { items: { wallpaper: { packs: 11 } }, absentItems: ["primer"] },
      source: { kind: "manual", ref: "Грунтовка выключена — обои и клей как в примере по умолчанию" },
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
    {
      name: "With pack prices: total cost",
      input: { price_wallpaper: 1500, "price_wallpaper-glue": 400 } as Partial<OboiInput>,
      expected: { costTotal: 17300 },
      source: {
        kind: "manual",
        ref: "11 рулонов × 1500 + 2 пачки клея × 400 = 17 300 ₽; грунтовка без цены — «без 1 позиции»",
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
        "Same 11 rolls. Qalculator subtracts the full door width and none of the window (33 strips); we hang strips wall by wall from the window corner (corner wraps and rests carried to the next wall): two strips fall wholly across the window and become pieces above and below it, none falls wholly across the 0,8 m door (32 strips). Their formula with zapas 0; the UI applies the user's extra %.",
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
      example: "Offset match, repeat 64 cm: the short pieces fit the tails",
      site: "Qalculator",
      url: "https://qalculator.ru/scripts/calc/otdelka.js",
      checkedAt: "2026-10-09",
      observed: { items: { wallpaper: { packs: 17 } }, summary: { perRoll: 2 } },
      explanation:
        "Qalculator adds half a repeat to every strip (3,2 + 0,32 = 3,52 → 2 per roll → 17 rolls). In a real cut only every second strip shifts by half a repeat: 0–2,8, 2,88–5,68, 5,76–8,56 m fit in 9,411 m even after the worst pattern start, so a roll gives 3 strips: 32 strips in 11 rolls, the pieces above and below the window in the tails.",
    },
  ],
};
