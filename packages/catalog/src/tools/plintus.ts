import type { ToolDef } from "./types";

const room = { kind: "length", unit: "m", min: 300, max: 100_000 } as const;

/** Plinth planks and fittings. Room size, shape, cut-out and doors come from “My room”; plank length is a norm. */
export const plintus: ToolDef = {
  id: "plintus",
  category: "pol",
  title: "Плинтус",
  outcome: "Планки, углы, заглушки и соединители",
  status: "live",
  fields: [
    { ...room, name: "lengthMm", label: "Длина комнаты", room: "length", main: true, planner: true },
    { ...room, name: "widthMm", label: "Ширина комнаты", room: "width", main: true, planner: true },
    { kind: "preset", label: "Длина планки", presets: ["p200", "p220", "p250"], main: true },
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
    { kind: "openings", name: "openings", label: "Двери", hint: "Окна на плинтус не влияют", planner: true },
    { kind: "length", unit: "m", min: 1000, max: 6000, name: "plankLengthMm", label: "Длина планки" },
    { kind: "toggle", name: "fasteners", label: "Крепить на дюбели", hint: "На клей или скотч — выключите" },
    { kind: "length", unit: "cm", min: 100, max: 1000, name: "fastenerSpacingMm", label: "Шаг крепежа" },
  ],
  presets: [
    { id: "p200", label: "2 м", values: { plankLengthMm: 2000 } },
    { id: "p220", label: "2,2 м", values: { plankLengthMm: 2200 } },
    { id: "p250", label: "2,5 м", values: { plankLengthMm: 2500 } },
  ],
  nextSteps: ["linoleum", "ploshchad-komnaty"],
  items: {
    plinth: { title: "Плинтус", photo: "plinth" },
    "plinth-corner-in": { title: "Внутренний угол", photo: "plinth-fittings" },
    "plinth-corner-out": { title: "Наружный угол", photo: "plinth-fittings" },
    "plinth-cap": { title: "Заглушка", photo: "plinth-fittings" },
    "plinth-joiner": { title: "Соединитель", photo: "plinth-fittings" },
    "plinth-fastener": { title: "Дюбель-саморез" },
  },
  summary: { run: "Длина плинтуса", perimeter: "Периметр" },
  steps: {
    perimeter: "Периметр = 2 × ({length} + {width}) = {perimeter} м",
    run: "Без дверей = {perimeter} − {doors} = {run} м",
    planks: "Планок = {run} / {plank} = {planks}, округляем вверх; обрезки идут в дело через соединители",
    corners: "Углов: внутренних {inner}, наружных {outer}",
    caps: "Заглушки: по 2 на дверь × {doors} = {caps}",
    joiners: "Соединители: по одному на стык, {planks} − 1 = {joiners}",
    fasteners: "Крепёж: на каждый прямой участок длина / шаг {spacing} м + 1 у края — {count} шт.",
  },
  warnings: {
    cut_too_large: "Вырез не меньше самой комнаты — считаем её прямоугольной. Проверьте размеры выреза",
    door_wider_than_wall: "Дверь шире самой длинной стены {wall} м. Проверьте ширину двери",
    doors_exceed_perimeter: "Двери шире всего периметра комнаты. Проверьте их размеры",
  },
  norms: ["plinth.length", "plinth.fastenerSpacing"],
};
