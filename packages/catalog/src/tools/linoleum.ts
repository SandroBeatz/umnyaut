import type { ToolDef } from "./types";

const room = { kind: "length", unit: "m", min: 300, max: 100_000 } as const;

/** Linoleum: every roll width × both directions, fewest seams first (Tarkett), then the smallest area. */
export const linoleum: ToolDef = {
  id: "linoleum",
  category: "pol",
  title: "Линолеум",
  outcome: "Ширина рулона, метры и швы — лучший вариант",
  status: "live",
  fields: [
    { ...room, name: "lengthMm", label: "Длина комнаты", room: "length", main: true, planner: true },
    { ...room, name: "widthMm", label: "Ширина комнаты", room: "width", main: true, planner: true },
    {
      kind: "select",
      name: "rollWidthMm",
      label: "Ширина рулона",
      main: true,
      dropdown: true,
      options: [
        { value: "0", label: "Подобрать" },
        { value: "1500", label: "1,5 м" },
        { value: "2000", label: "2 м" },
        { value: "2500", label: "2,5 м" },
        { value: "3000", label: "3 м" },
        { value: "3500", label: "3,5 м" },
        { value: "4000", label: "4 м" },
      ],
    },
    {
      kind: "length",
      unit: "cm",
      min: 0,
      max: 300,
      name: "overlapMm",
      label: "Нахлёст на шов",
      hint: "Для подгонки рисунка 3–5 см; без рисунка — 0",
    },
    {
      kind: "length",
      unit: "cm",
      min: 0,
      max: 300,
      name: "allowanceMm",
      label: "Припуск на подрезку",
      hint: "Стены неровные — добавьте 5–10 см",
    },
    { kind: "length", unit: "cm", min: 1, max: 100, name: "cutStepMm", label: "Шаг отреза в магазине" },
  ],
  nextSteps: ["plintus", "ploshchad-komnaty"],
  items: { linoleum: { title: "Линолеум", photo: "linoleum" } },
  summary: {
    length: "Длина отреза",
    width: "Ширина рулона",
    sheets: "Полотен",
    seams: "Швов",
    boughtArea: "Площадь покупки",
    waste: "Уйдёт в обрезки",
  },
  steps: {
    room: "Комната {length} × {width} = {area} м²",
    allowance: "Припуск на подрезку {allowance} м к длине и ширине",
    variant_length: "Рулон {width} м вдоль длины: полотен {sheets}, отрез {length} м, {area} м²",
    variant_width: "Рулон {width} м поперёк: полотен {sheets}, отрез {length} м, {area} м²",
    best: "Берём {width} м: швов {seams}, отрез {length} м, {area} м² — меньше швов, затем меньше площадь",
  },
  norms: ["linoleum.seamOverlap", "linoleum.rollWidthMin", "linoleum.rollWidthMax"],
};
