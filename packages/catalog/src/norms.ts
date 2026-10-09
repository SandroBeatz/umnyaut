/**
 * Norm data (consumption rates, overlaps, lux tables) with where each number comes from.
 * Tools read them by id; content text substitutes them as `{{norm.<id>}}`. Never add a value without a source.
 */
export interface Norm {
  value: number;
  /** Display unit, Russian («мм», «кг/м²», «%»). */
  unit: string;
  /** Datasheet, standard (СП, ГОСТ) or manufacturer page the value is taken from. */
  source: string;
  /** Date the source was last checked, YYYY-MM-DD. */
  checkedAt: string;
  note?: string;
  /**
   * A working default without a confirmed primary source (docs/code/norm-sources-wave-1.md → status
   * «default, unconfirmed»). The UI says «проверьте по этикетке» next to it.
   */
  unconfirmed?: boolean;
}

const CHECKED = "2026-10-09";
/** Primary sources; ids match the Sources table in docs/code/norm-sources-wave-1.md. */
const S = {
  S1: "Ceresit, «Как рассчитать расход плиточного клея на 1 м²», https://ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-kleya-dlya-plitki/",
  S2: "Ceresit CM 11 Plus, https://www.ceresit.ru/ru/products/tiling/tile-adhesives/cm_11_plus.html",
  S3: "Ceresit, «Как рассчитать расход затирки для плитки», https://ceresit.ru/ru/blog/plitochnaya-oblicovka/raschet-zatirki-dlya-plitki/",
  S5: "ГОСТ 6810-2002 «Обои. Технические условия», https://docs.cntd.ru/document/1200032267",
  S6: "Метилан Флизелин Ультра Премиум, https://www.metylan.ru/ru/katalog/oboynyy-kley-metylan/metilan-flizelin-ultra-premium.html",
  S7: "PARADE Professional E2 PRO'LATEX2, https://parade.ru/catalog/professional/parade-professional-e2-pro-latex2/",
  S8: "Ceresit CT 17 PRO, https://www.ceresit.ru/ru/products/tiling/supplementary-materials/ct_17_pro/",
  S9: "Tarkett, «Укладка ламината и уход», https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-laminata-i-ukhod/",
  S10: "Quick-Step, «Монтаж ламината», https://www.quick-step.ru/laminate/installation/",
  S11: "Tarkett, «Укладка линолеума и уход», https://www.tarkett.ru/hub/vidy-napolnykh-pokrytiy/ukladka-linoleuma-i-ukhod/",
  S12: "ГОСТ 7251-2016 «Линолеум поливинилхлоридный…», https://docs.cntd.ru/document/1200141418",
  S13: "Arbiton, каталог плинтусов, https://arbiton.com/ru/plintus",
  S14: "IDEAL, каталог плинтусов, https://ideal.ru/product/plintusy/",
} as const;

const norm = (value: number, unit: string, source: string, extra: Partial<Norm> = {}): Norm => ({
  value,
  unit,
  source,
  checkedAt: CHECKED,
  ...extra,
});

/** Keyed by dotted id: `underlay.overlap`. Every entry has a row in docs/code/norm-sources-wave-1.md. */
export const norms: Readonly<Record<string, Norm>> = {
  "tileAdhesive.notch4": norm(2.0, "кг/м²", S.S1, { note: "шпатель 4 мм, плитка до 10 см" }),
  "tileAdhesive.notch6": norm(2.7, "кг/м²", S.S1, { note: "шпатель 6 мм, плитка до 15 см" }),
  "tileAdhesive.notch8": norm(3.2, "кг/м²", S.S1, { note: "шпатель 8 мм, плитка до 20 см" }),
  "tileAdhesive.notch10": norm(4.2, "кг/м²", S.S1, { note: "шпатель 10 мм, плитка до 30 см" }),
  "tileAdhesive.perMm": norm(1.2, "кг/м² на 1 мм", S.S2),
  "tileAdhesive.bag": norm(25, "кг", S.S2),
  "grout.density": norm(1.6, "кг/дм³", S.S3, { note: "у Mapei Keracolor FF по таблице ≈ 1,5; берём больше" }),
  "grout.reserve": norm(10, "%", S.S3, { note: "в источнике 10–15%" }),
  "tile.joint.wall": norm(2, "мм", S.S3, { note: "в источнике 1,5–2 мм для 15 × 15" }),
  "tile.joint.floor": norm(3, "мм", S.S3, { note: "в источнике 2–3 мм для 33 × 33" }),
  "wallpaper.rollWidth": norm(0.53, "м", S.S5),
  "wallpaper.rollLength": norm(10.05, "м", S.S5),
  "wallpaperPaste.coverage": norm(30, "м² на 250 г", S.S6, {
    unconfirmed: true,
    note: "флизелиновые обои; цифра не сверена с пачкой",
  }),
  "paint.coverage": norm(10, "м²/л", S.S7, { note: "в источнике 12–14 м²/л; берём с запасом на шероховатые стены" }),
  "paint.coats": norm(2, "слоя", S.S7),
  "primer.consumption": norm(0.15, "л/м²", S.S8, { note: "в источнике 0,1–0,2 л/м²" }),
  "laminate.minOffset": norm(300, "мм", `${S.S9}; ${S.S10}`),
  "laminate.minLastRow": norm(50, "мм", S.S10),
  "laminate.expansionGap": norm(10, "мм", S.S9, { note: "в источнике 10–15 мм" }),
  "laminate.waste.diagonal": norm(15, "%", "по опыту укладчиков", {
    unconfirmed: true,
    note: "первоисточника нет; ждёт мастера-рецензента",
  }),
  "laminate.waste.herringbone": norm(15, "%", "по опыту укладчиков", {
    unconfirmed: true,
    note: "первоисточника нет; ждёт мастера-рецензента",
  }),
  "linoleum.seamOverlap": norm(50, "мм", S.S11, { note: "в источнике 3–5 см" }),
  "linoleum.wallTrim": norm(10, "мм", S.S11, { note: "в источнике 0,5–1 см" }),
  "linoleum.rollWidthMin": norm(1.2, "м", S.S12),
  "linoleum.rollWidthMax": norm(2.4, "м", S.S12, { note: "по таблице 1 до 3 м" }),
  "plinth.length": norm(2.5, "м", `${S.S13}; ${S.S14}`),
};

export const getNorm = (id: string, from: Readonly<Record<string, Norm>> = norms): Norm | undefined => from[id];
