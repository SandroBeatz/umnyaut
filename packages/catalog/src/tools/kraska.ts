import type { ToolDef } from "./types";

const room = { kind: "length", unit: "m", min: 300, max: 100_000 } as const;

/**
 * Paint for walls and/or ceiling with primer. Coverage and coats are norms with sources (PARADE, S7; owner's
 * conservative 10 m²/л); cans 0,9 / 2,7 / 9 л from the same datasheet; primer from Ceresit CT 17 PRO (S8).
 */
export const kraska: ToolDef = {
  id: "kraska",
  category: "steny",
  title: "Краска",
  outcome: "Литры и набор банок, грунтовка",
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
    {
      kind: "select",
      name: "surface",
      label: "Что красим",
      main: true,
      dropdown: true,
      options: [
        { value: "walls", label: "Стены" },
        { value: "ceiling", label: "Потолок" },
        { value: "both", label: "Стены и потолок" },
      ],
    },
    { kind: "openings", name: "openings", label: "Окна и двери", planner: true },
    { kind: "number", min: 1, max: 5, step: 1, name: "coats", label: "Слоёв краски" },
    {
      kind: "number",
      min: 1,
      max: 30,
      step: 0.5,
      unit: "м²/л",
      name: "coverageM2PerL",
      label: "Расход: м² на литр",
      hint: "На банке, за один слой. По умолчанию с запасом на неровные стены",
    },
    { kind: "toggle", name: "primer", label: "Грунтовать перед покраской" },
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
  nextSteps: ["ploshchad-sten", "oboi"],
  items: {
    paint: { title: "Краска", photo: "paint" },
    primer: { title: "Грунтовка", photo: "primer" },
  },
  summary: {
    paintLitres: "Краски нужно",
    area: "Площадь покраски",
    primerLitres: "Грунтовки нужно",
  },
  steps: {
    walls: "Стены = {perimeter} × {height} − окна и двери {openings} = {area} м²",
    ceiling: "Потолок = {length} × {width} = {area} м²",
    area: "Всего = {walls} + {ceiling} = {area} м²",
    paint: "Краска = {area} × {coats} слоя / {coverage} м²/л = {litres} л",
    cans_set: "Набор банок с наименьшим остатком: {bought} л на {litres} л, из равных — меньше банок",
    cans: "Банка {size} л — {count} шт.",
    primer: "Грунтовка = {area} × {rate} л/м² = {litres} л → {packs} × {size} л",
  },
  warnings: {
    opening_too_tall: "Проём {height} м выше стены {wall} м. Проверьте высоту проёма или потолка",
    openings_exceed_walls: "Окна и двери больше площади стен. Проверьте их размеры",
    primer_small_need:
      "Грунтовки нужно всего {need} л, а канистра {size} л. Посмотрите упаковку 1 л — поле «Объём канистры»",
  },
  norms: ["paint.coverage", "paint.coats", "primer.consumption"],
};
