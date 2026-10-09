import type { ToolDef } from "./types";

const room = { kind: "length", unit: "m", min: 300, max: 100_000 } as const;
const part = { kind: "length", unit: "m", min: 0, max: 20_000 } as const;

/** Plane geometry, no norms. Writes length, width, shape and cut-out of “My room”. */
export const ploshchadKomnaty: ToolDef = {
  id: "ploshchad-komnaty",
  category: "osnova",
  title: "Площадь комнаты",
  outcome: "Площадь пола и периметр, Г-образная комната, ниши",
  status: "live",
  fields: [
    { ...room, name: "lengthMm", label: "Длина комнаты", room: "length", main: true, planner: true },
    { ...room, name: "widthMm", label: "Ширина комнаты", room: "width", main: true, planner: true },
    { kind: "preset", label: "Типовые комнаты", presets: ["kitchen", "bedroom", "living", "bath"], main: true },
    {
      kind: "select",
      name: "shape",
      label: "Форма комнаты",
      room: "shape",
      options: [
        { value: "rect", label: "Прямоугольная" },
        { value: "l", label: "Г-образная" },
      ],
    },
    {
      kind: "length",
      unit: "m",
      min: 0,
      max: 100_000,
      name: "cutLengthMm",
      label: "Длина выреза",
      hint: "Угол, которого нет у комнаты",
      room: "cutLength",
      when: { shape: "l" },
    },
    {
      kind: "length",
      unit: "m",
      min: 0,
      max: 100_000,
      name: "cutWidthMm",
      label: "Ширина выреза",
      room: "cutWidth",
      when: { shape: "l" },
    },
    { ...part, name: "nicheLengthMm", label: "Ниша: ширина", hint: "Прибавится к площади" },
    { ...part, name: "nicheDepthMm", label: "Ниша: глубина" },
    { ...part, name: "protrusionLengthMm", label: "Выступ: ширина", hint: "Колонна или короб у стены — вычтем" },
    { ...part, name: "protrusionDepthMm", label: "Выступ: глубина" },
  ],
  presets: [
    { id: "kitchen", label: "Кухня 9 м²", values: { lengthMm: 3000, widthMm: 3000 } },
    { id: "bedroom", label: "Спальня 12 м²", values: { lengthMm: 4000, widthMm: 3000 } },
    { id: "living", label: "Зал 18 м²", values: { lengthMm: 5000, widthMm: 3600 } },
    { id: "bath", label: "Ванная 4 м²", values: { lengthMm: 2000, widthMm: 2000 } },
  ],
  nextSteps: ["ploshchad-sten"],
  summary: { floorArea: "Площадь пола", perimeter: "Периметр" },
  steps: {
    area_rect: "Площадь = {length} × {width} = {area} м²",
    area_l: "Площадь = {length} × {width} − {cutLength} × {cutWidth} = {area} м²",
    niche: "Ниша {length} × {depth} = {area} м², прибавляем",
    protrusion: "Выступ {length} × {depth} = {area} м², вычитаем",
    area_total: "Площадь пола с нишей и выступом: {area} м²",
    perimeter: "Периметр = 2 × ({length} + {width}) = {perimeter} м",
    perimeter_l: "У Г-образной комнаты периметр как у прямоугольника: 2 × ({length} + {width}) = {perimeter} м",
    perimeter_total: "Боковые стенки ниши и выступа добавляют {extra} м, периметр {perimeter} м",
  },
  warnings: {
    cut_too_large: "Вырез не меньше комнаты по длине или ширине. Посчитали как прямоугольник — проверьте вырез",
    protrusion_too_large: "Выступ больше комнаты. Проверьте его размеры",
  },
};
