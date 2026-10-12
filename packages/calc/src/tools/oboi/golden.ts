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
        summary: { strips: 32, stripLength: 2.8, perRoll: 3, pieces: 4, wallArea: 44.78 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: `${TRIM}. ${CORNER}. Окно 1,2 × 1,4 на стене 4 (4,3 м) от 1,55 м, подоконник 0,9 м; дверь 0,8 на стене 3 от 0,6 м. Стена 4 от угла у окна: полосы с −0,015, 0,515, 1,045, 1,575, 2,105, 2,635, 3,165, 3,695, 4,225 — две полосы 1,575–2,635 целиком над окном → куски над (0,4 + 0,1 = 0,5) и под (0,9 + 0,1 = 1,0); последняя в углу 7,5 см, остаток 53 − 7,5 − 1,5 = 44 см → стена 1: полосы от 0,44, последняя в углу 45 см, остаток 6,5 см → стена 2: от 0,065, последняя в углу 52,5 см, остаток −1 см — нет → стена 3 (до 4,585): с 0, последняя в углу 36 см; дверь 0,6–1,4 целиком не закрывает ни одной полосы. Полос во всю высоту 7 + 8 + 8 + 9 = 32 по 2,8 м, 3 из рулона (хвост 1,65) → 11 рулонов (в 11-м 2, хвост 4,45); куски 1,0 + 0,5 в хвосты рулонов 1 и 2. 110,55 − 4,45 = 106,1 м. Клей 44,78 / 30 → 2. Грунт под обои 44,78 × 0,15 = 6,717 л → 1 канистра 10 л (Ceresit CT 17 PRO: 0,1–0,2 л/м²). Версия 1 (по периметру) — тоже 32 полосы и 11 рулонов, но 3 куска: 0,8 над дверью, куда полоса не помещается`,
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
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "12 / 0,53 = 22,6 → 23 полосы по 2,6 м; по стенам с заходами в углы — тоже 23: стены по 6, 6, 6 и 5 полос (остатки угловых полос 15, 31,5 и 48 см идут на следующие стены); 3 из рулона; 23 / 3 → 8 рулонов, в последнем 2 полосы, хвост 10,05 − 5,2 = 4,85; 8 × 10,05 − 4,85 = 75,55 м. Стены 30 м², клей 30 / 30 = 1 пачка",
      },
    },
    {
      name: "Wide roll 1.06 × 10.05 m, mockup room",
      input: { rollWidthMm: 1060 },
      expected: {
        items: { wallpaper: { packs: 6, need: 55.85, leftover: 4.45 } },
        summary: { strips: 17, perRoll: 3, pieces: 0 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. Полосы 1,06 по стенам: стена 4 с −0,015, 1,045, 2,105, 3,165, 4,225 (угол 7,5 см, остаток 97 см) — окно 1,55–2,75 целиком не закрывает ни одной; стена 1 с 0,97: 0,97, 2,03, 3,09, 4,15 (угол 45, остаток 59,5); стена 2 с 0,595: 0,595, 1,655, 2,715, 3,775 (угол 52,5, остаток 52); стена 3 с 0,52: 0,52, 1,58, 2,64, 3,7 (угол 90). 5 + 4 + 4 + 4 = 17 полос, кусков нет; 3 из рулона → 6 рулонов (в 6-м 2, хвост 4,45). 60,3 − 4,45 = 55,85 м`,
      },
    },
    {
      name: "Straight match, repeat 64 cm: pieces need an extra roll",
      input: { repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 12, need: 112.329, leftover: 8.271 } },
        summary: { strips: 32, stripLength: 3.2, perRoll: 3, pieces: 4 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "Полосы и куски — как в примере по умолчанию (32 полосы, куски 1,0, 1,0, 0,5, 0,5). Рабочая длина 9,411; полосы 0–2,8, 3,2–6,0, 6,4–9,2, хвост 0,211. 32 полосы → 11 рулонов, в 11-м 2 полосы (до 6,0). Куски кратно 0,64: 1,0 в рулон 11 (6,4–7,4), 1,0 там же (7,68–8,68), 0,5 не входит (8,96 + 0,5 > 9,411) → рулон 12 (0–0,5), второй 0,5 там же (0,64–1,14). Хвост рулона 12: 9,411 − 1,14 = 8,271. 120,6 − 8,271 = 112,329 м",
      },
    },
    {
      name: "Offset match, repeat 64 cm: the short pieces fit the tails",
      input: { repeatMm: 640, match: "offset" },
      expected: {
        items: { wallpaper: { packs: 11, need: 109.699, leftover: 0.851 } },
        summary: { strips: 32, perRoll: 3, pieces: 4 },
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411, фазы 0 и 0,32 по очереди по столбцам на стенах (столбцы кусков тоже). Каждый рулон в своей системе отсчёта: 0–2,8, 2,88–5,68, 5,76–8,56 (новый рулон начинается сразу с нужной фазы — запас на подгонку уже это покрывает); начала рулонов чередуются 0 и 0,32. 30 полос в 10 рулонах, 31-я и 32-я — в 11-м (0–2,8, 2,88–5,68). Фаза куска — фаза его столбца плюс глубина от потолка: К1 (столбец со сдвигом 0,32): над окном 0,5 с фазой 0,32, под окном 1,0 с фазой (0,32 + 1,8) mod 0,64 = 0,2; К2 (сдвиг 0): 0,5 с фазой 0, 1,0 с фазой 1,8 mod 0,64 = 0,52. 1,0 (0,2) в рулон 11 с 5,96; 1,0 (0,52) там же с 7,56 (до 8,56); 0,5 (0,32) — в рулон 1 с 8,64; 0,5 (0) — в рулон 2 (начало 0,32) с 8,64. Самый большой хвост 9,411 − 8,56 = 0,851. 110,55 − 0,851 = 109,699 м. В версии 1 куски 1,5 и 0,8 не помещались — 12 рулонов",
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
        summary: { strips: 32, stripLength: 3.2, perRoll: 2, pieces: 4 },
        warnings: ["repeat_lucky_start"],
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411; полосы 3,1: 0–3,1, 3,2–6,3; третья 6,4 + 3,1 = 9,5 не входит → 2 из рулона (правило мастеров: 10,05 / (3,1 + 0,64) → 2). 32 / 2 = 16 рулонов, хвост 3,111; куски над окном 0,7 + 0,1 = 0,8 и под ним 1,0 (две полосы) — в хвосты рулонов 1 и 2. 160,8 − 3,111 = 157,689 м. При удачном начале рисунка (без потери в начале рулона) 0–3,1, 3,2–6,3, 6,4–9,5 → 3 из рулона, 11 рулонов + 1 на куски = 12 — подсказка",
      },
    },
    {
      name: "Offset match, repeat 50 cm, height 2.8 m: every roll gives 3 strips",
      input: { heightMm: 2800, repeatMm: 500, match: "offset" },
      expected: {
        items: { wallpaper: { packs: 12, need: 111.649, leftover: 8.951 } },
        summary: { strips: 32, perRoll: 3, pieces: 4 },
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 10,05 − 0,499 = 9,551; полоса 2,9: 0–2,9, 3,25–6,15, 6,5–9,4 в каждом рулоне. 32 полосы → 11 рулонов (в 11-м 2 полосы до 6,15). Куски: под окном 0,9 + 0,1 = 1,0 (×2), над ним 0,5 + 0,1 = 0,6 (×2). 1,0 в рулон 11 с 6,25, 1,0 с 7,25, 0,6 с 8,25 (до 8,85); второй 0,6 не входит (9,0 + 0,6 > 9,551) → рулон 12. 120,6 − 8,951 = 111,649 м",
      },
    },
    {
      name: "Straight match 64 cm, height 2.9 m: strips use the roll almost to the end",
      input: { heightMm: 2900, repeatMm: 640 },
      expected: {
        items: { wallpaper: { packs: 12, need: 113.169, leftover: 7.431 } },
        summary: { perRoll: 3 },
        warnings: ["roll_tight"],
      },
      source: {
        kind: "manual",
        ref: "Рабочая длина 9,411; полосы 3,0: 0–3,0, 3,2–6,2, 6,4–9,4 — остаётся 0,011 м, меньше 1,5% рулона. 32 полосы → 11 рулонов. Куски: под окном 1,0 (×2), над ним 0,6 + 0,1 = 0,7 (×2): 1,0 в рулон 11 с 6,4 и с 7,68 (до 8,68); 0,7 не входит (8,96 + 0,7 > 9,411) → рулон 12 с 0 и с 1,28 (до 1,98). 120,6 − 7,431 = 113,169 м",
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
        summary: { strips: 31, pieces: 5 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. Как в примере по умолчанию, но дверь 0,6–1,8 на стене 3: полоса 1,06–1,59 целиком над дверью → кусок 0,7 + 0,1 = 0,8. 31 полоса → 10 рулонов по 3 и 1 полоса в 11-м (хвост 7,25); куски 1,0, 1,0, 0,8, 0,5, 0,5 — в хвосты 1,65 рулонов 1, 2, 3, 1, 2. 110,55 − 7,25 = 103,3 м`,
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
        items: { wallpaper: { packs: 11, need: 104.799, leftover: 5.751 } },
        summary: { strips: 30, pieces: 7, perRoll: 3 },
      },
      source: {
        kind: "manual",
        ref: `${CORNER}. formula-reviewer, 2026-10-12. Окно 1,5–3,2 на стене 4: полосы 1,575, 2,105, 2,635 целиком над ним (запас 2 см есть) → К1–К3, куски над 0,4 + 0,1 = 0,5 и под 0,7 + 0,1 = 0,8; дверь 0,53–1,33 на стене 3: полоса 0,53–1,06 → К4, кусок над 0,5 + 0,1 = 0,6. Полос 6 + 8 + 8 + 8 = 30. Рабочая длина 10,05 − 0,699 = 9,351; полоса 2,6, шаг 2,8: 3 из рулона до 8,2 → 10 рулонов. Кусок под окном начинается на 1,8 от потолка — рисунок там в фазе 1,8 mod 0,7 = 0,4: в рулонах 1–10 ближайшее место 8,8, 8,8 + 0,8 > 9,351 → рулон 11 (0–0,8, 1,4–2,2, 2,8–3,6). 0,6 и три 0,5 (фаза 0) — в рулоны 1–4 с 8,4. Хвост рулона 11: 9,351 − 3,6 = 5,751; 110,55 − 5,751 = 104,799 м. С куском «в любой фазе» выходило 10 рулонов — недобор`,
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
        summary: { strips: 32, pieces: 2 },
        warnings: ["window_above_ceiling"],
      },
      source: {
        kind: "manual",
        ref: "2,0 + 1,4 = 3,4 > 2,7: окно ставим под потолок (подоконник 1,3). Над ним куска нет, под ним 1,3 + 0,1 = 1,4 у двух полос: 32 полосы и 2 куска, 11 рулонов, предупреждение",
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
