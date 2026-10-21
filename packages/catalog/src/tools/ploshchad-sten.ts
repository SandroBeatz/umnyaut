import type { ToolDef } from "./types";

const room = { kind: "length", unit: "m", min: 300, max: 100_000 } as const;

/** Plane geometry, no norms. Reads and writes the size, height and openings of “My room”. */
export const ploshchadSten: ToolDef = {
  id: "ploshchad-sten",
  category: "osnova",
  title: "Площадь стен",
  outcome: "Стены без окон и дверей, потолок, периметр",
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
    { kind: "preset", label: "Типовая высота", presets: ["h250", "h270", "h300"], main: true },
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
      hint: "Стены — как у прямоугольника, меньше только потолок",
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
    {
      kind: "select",
      name: "cutCorner",
      label: "Где вырез на плане",
      room: "cutCorner",
      dropdown: true,
      options: [
        { value: "ne", label: "Справа вверху" },
        { value: "se", label: "Справа внизу" },
        { value: "sw", label: "Слева внизу" },
        { value: "nw", label: "Слева вверху" },
      ],
      when: { shape: "l" },
    },
    { kind: "openings", name: "openings", label: "Окна и двери", planner: true },
  ],
  presets: [
    { id: "h250", label: "2,5 м", values: { heightMm: 2500 } },
    { id: "h270", label: "2,7 м", values: { heightMm: 2700 } },
    { id: "h300", label: "3 м", values: { heightMm: 3000 } },
  ],
  nextSteps: ["ploshchad-komnaty"],
  summary: {
    wallArea: "Стены без окон и дверей",
    grossWallArea: "Стены целиком",
    openingsArea: "Окна и двери",
    ceilingArea: "Потолок",
    perimeter: "Периметр",
  },
  steps: {
    perimeter: "Периметр = 2 × ({length} + {width}) = {perimeter} м",
    perimeter_l: "У Г-образной комнаты периметр как у прямоугольника: 2 × ({length} + {width}) = {perimeter} м",
    gross: "Стены целиком = {perimeter} × {height} = {area} м²",
    openings: "Окна и двери ({count} шт.) = {area} м²",
    net: "Без окон и дверей = {gross} − {openings} = {area} м²",
    ceiling: "Потолок = пол = {length} × {width} = {area} м²",
    ceiling_l: "Потолок = пол = {length} × {width} − {cutLength} × {cutWidth} = {area} м²",
  },
  warnings: {
    cut_too_large: "Вырез не меньше комнаты по длине или ширине. Посчитали как прямоугольник — проверьте вырез",
    opening_too_tall: "Проём {height} м выше стены {wall} м. Проверьте высоту проёма или потолка",
    window_above_ceiling:
      "Окон выше потолка: {count} — высота подоконника плюс высота окна больше высоты стен. Вычитаем окно только до потолка; проверьте высоты на плане",
    openings_exceed_walls: "Окна и двери больше площади стен. Проверьте их размеры",
    opening_off_wall: "Проёмов не помещается на своей стене: {count}. Проверьте отступ от угла на плане",
  },
};
