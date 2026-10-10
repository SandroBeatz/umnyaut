import type { ToolDef } from "./types";

const room = { kind: "length", unit: "m", min: 300, max: 100_000 } as const;

/**
 * Wallpaper by strips. Room size, height and openings come from “My room”; roll sizes from ГОСТ 6810
 * and market presets (C03); trim and paste coverage are norms with sources.
 */
export const oboi: ToolDef = {
  id: "oboi",
  category: "steny",
  title: "Обои",
  outcome: "Рулоны по полосам с учётом рисунка, клей",
  status: "live",
  fields: [
    { ...room, name: "lengthMm", label: "Длина комнаты", room: "length", main: true, planner: true },
    { ...room, name: "widthMm", label: "Ширина комнаты", room: "width", main: true, planner: true },
    {
      kind: "length",
      unit: "m",
      min: 1000,
      max: 10_000,
      name: "heightMm",
      label: "Высота потолка",
      room: "height",
      main: true,
      planner: true,
    },
    { kind: "preset", label: "Рулон", presets: ["r053", "r106", "r106x25"], main: true },
    { kind: "openings", name: "openings", label: "Окна и двери", planner: true },
    { kind: "length", unit: "m", min: 300, max: 1500, name: "rollWidthMm", label: "Ширина рулона" },
    { kind: "length", unit: "m", min: 5000, max: 50_000, name: "rollLengthMm", label: "Длина рулона" },
    {
      kind: "length",
      unit: "cm",
      min: 0,
      max: 1500,
      name: "repeatMm",
      label: "Раппорт",
      hint: "Шаг рисунка, указан на этикетке. 0 — без подгонки",
    },
    {
      kind: "select",
      name: "match",
      label: "Стыковка рисунка",
      options: [
        { value: "straight", label: "Прямая" },
        { value: "offset", label: "Со смещением" },
      ],
    },
    {
      kind: "length",
      unit: "cm",
      min: 0,
      max: 300,
      name: "trimMm",
      label: "Припуск на подрезку",
      hint: "Сверху и снизу вместе",
    },
    {
      kind: "number",
      min: 1,
      max: 200,
      step: 1,
      unit: "м²",
      name: "pasteCoverageM2",
      label: "Клей: площадь на пачку",
      hint: "Проверьте по пачке: для тяжёлых обоев меньше",
    },
    { kind: "toggle", name: "primer", label: "Грунтовать стены под обои" },
    {
      kind: "number",
      min: 0.05,
      max: 1,
      step: 0.01,
      unit: "л/м²",
      name: "primerRateLPerM2",
      label: "Расход грунтовки",
      hint: "На канистре: 0,1–0,2 л/м²",
    },
    { kind: "number", min: 0.5, max: 50, step: 0.5, unit: "л", name: "primerPackL", label: "Объём канистры" },
  ],
  presets: [
    { id: "r053", label: "0,53 × 10 м", values: { rollWidthMm: 530, rollLengthMm: 10_050 } },
    { id: "r106", label: "1,06 × 10 м", values: { rollWidthMm: 1060, rollLengthMm: 10_050 } },
    { id: "r106x25", label: "1,06 × 25 м", values: { rollWidthMm: 1060, rollLengthMm: 25_000 } },
  ],
  nextSteps: ["kraska", "ploshchad-sten"],
  items: {
    wallpaper: { title: "Обои", photo: "wallpaper" },
    "wallpaper-glue": { title: "Обойный клей", photo: "wallpaper-glue" },
    primer: { title: "Грунтовка", photo: "primer" },
  },
  summary: {
    strips: "Полос во всю высоту",
    stripLength: "Длина полосы",
    perRoll: "Полос из рулона",
    pieces: "Кусков над и под проёмами",
    wallArea: "Площадь оклейки",
  },
  steps: {
    perimeter: "Периметр = 2 × ({length} + {width}) = {perimeter} м",
    strip: "Полоса = высота {height} + припуск {trim} = {length} м",
    repeat:
      "С подгонкой рисунка (раппорт {repeat} м) полоса занимает {length} м рулона; в начале рулона до подгонки уходит до {repeat} м",
    repeat_offset:
      "С подгонкой рисунка (раппорт {repeat} м) полоса занимает {length} м рулона, каждая вторая — ещё до {half} м на смещение",
    strips:
      "Полос = ({perimeter} − проёмы {openings}) / {width} = {strips}, округляем вверх. От проёма вычитаем только ширину, где полосу во всю высоту можно не клеить",
    pieces: "Над дверями и над и под окнами — {count} кусков, режем из остатков рулонов",
    per_roll: "Из рулона {roll} м выходит {perRoll} полос во всю высоту",
    strip_rolls: "На {strips} полос по {perRoll} из рулона — {rolls} рулонов",
    pieces_rolls: "Куски над и под проёмами не вошли в остатки: ещё {extra}",
    rolls: "Рулонов: {rolls}, самый большой остаток {tail} м",
    area: "Площадь оклейки = {gross} − {openings} = {area} м²",
    paste: "Клей = {area} / {coverage} м² на пачку → {packs}",
    primer: "Грунтовка = {area} × {rate} л/м² = {litres} л → {packs} × {size} л",
  },
  warnings: {
    opening_too_tall: "Проём {height} м выше стены {wall} м. Проверьте высоту проёма или потолка",
    openings_exceed_walls: "Окна и двери больше площади стен. Проверьте их размеры",
    strip_longer_than_roll: "Полоса {strip} м длиннее рулона {roll} м. Выберите рулон длиннее",
    piece_longer_than_roll:
      "Кусок над и под окном длиннее рулона {roll} м. Проверьте высоту окна или выберите рулон длиннее",
    repeat_lucky_start:
      "Посчитано с запасом на неудачное начало рисунка в каждом рулоне. Если рисунок начнётся удачно, хватит {rolls} — лишние рулоны не вскрывайте, целые проще вернуть",
    roll_tight:
      "Полосы занимают рулон почти целиком: остаётся {slack} м. Рулон может быть короче на 1,5% — возьмите один про запас",
  },
  norms: [
    "wallpaper.rollWidth",
    "wallpaper.trimAllowance",
    "wallpaper.rollLengthTolerance",
    "wallpaperPaste.coverage",
    "primer.consumption",
  ],
};
