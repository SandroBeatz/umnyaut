import type { ToolDef } from "./types";

const room = { kind: "length", unit: "m", min: 300, max: 100_000 } as const;

/** Laminate laid row by row with offcut reuse (Quick-Step, Tarkett rules); diagonal and herringbone by waste %. */
export const laminat: ToolDef = {
  id: "laminat",
  category: "pol",
  title: "Ламинат",
  outcome: "Пачки по рядам с обрезками, узкий последний ряд, подложка",
  status: "live",
  fields: [
    { ...room, name: "lengthMm", label: "Длина комнаты", room: "length", main: true, planner: true },
    { ...room, name: "widthMm", label: "Ширина комнаты", room: "width", main: true, planner: true },
    {
      kind: "select",
      name: "method",
      label: "Укладка",
      main: true,
      dropdown: true,
      options: [
        { value: "straight", label: "Прямая" },
        { value: "diagonal", label: "Диагональ" },
        { value: "herringbone", label: "Ёлочка" },
      ],
    },
    { kind: "preset", label: "Доска", presets: ["b1285", "b1380", "b1292"], main: true },
    {
      kind: "select",
      name: "direction",
      label: "Ряды идут",
      options: [
        { value: "length", label: "Вдоль длины" },
        { value: "width", label: "Вдоль ширины" },
      ],
      when: { method: "straight" },
    },
    { kind: "length", unit: "mm", min: 300, max: 3000, name: "boardLengthMm", label: "Длина доски" },
    { kind: "length", unit: "mm", min: 50, max: 500, name: "boardWidthMm", label: "Ширина доски" },
    { kind: "number", min: 1, max: 50, step: 1, unit: "шт.", name: "boardsPerPack", label: "Досок в пачке" },
    { kind: "length", unit: "mm", min: 0, max: 30, name: "gapMm", label: "Зазор у стен", hint: "10–15 мм" },
    {
      kind: "length",
      unit: "mm",
      min: 100,
      max: 1000,
      name: "minOffsetMm",
      label: "Смещение стыков",
      hint: "Не меньше 30 см — по инструкции к ламинату",
    },
    { kind: "toggle", name: "underlay", label: "Подложка" },
    {
      kind: "number",
      min: 1,
      max: 100,
      step: 1,
      unit: "м²",
      name: "underlayRollM2",
      label: "Подложка: м² в рулоне",
      hint: "Проверьте по упаковке",
    },
  ],
  presets: [
    { id: "b1285", label: "1285 × 192, 9 шт.", values: { boardLengthMm: 1285, boardWidthMm: 192, boardsPerPack: 9 } },
    { id: "b1380", label: "1380 × 193, 8 шт.", values: { boardLengthMm: 1380, boardWidthMm: 193, boardsPerPack: 8 } },
    { id: "b1292", label: "1292 × 194, 8 шт.", values: { boardLengthMm: 1292, boardWidthMm: 194, boardsPerPack: 8 } },
  ],
  nextSteps: ["plintus", "ploshchad-komnaty"],
  items: {
    laminate: { title: "Ламинат", photo: "laminate" },
    underlay: { title: "Подложка", photo: "underlay" },
  },
  summary: {
    rows: "Рядов",
    boards: "Досок",
    lastRow: "Последний ряд",
    floorArea: "Площадь пола",
  },
  steps: {
    rows: "Рядов = ({across} м − 2 × {gap} мм) / {board} мм → {rows}, последний ряд {last} мм",
    boards:
      "Раскладка рядами: обрезок от конца ряда начинает следующий, обрезок от начала может только закончить ряд (замки не перевернуть), стыки соседних рядов не ближе смещения — досок {boards}, по {perPack} в пачке → {packs}",
    waste: "Площадь {area} м² + {pct}% на подрезку = {need} м²",
    packs: "Пачка {pack} м² — пачек {packs}",
    underlay: "Подложка = {area} м² / {roll} м² в рулоне → {rolls}",
  },
  warnings: {
    narrow_last_row:
      "Последний ряд выйдет {last} см — уже 5 см. Подрежьте первый ряд, чтобы оба крайних ряда были по {trim} см",
    offset_impossible:
      "Ряд слишком короткий, чтобы выдержать смещение стыков {offset} см и куски не короче него. Проверьте размеры или уменьшите смещение",
    other_direction_cheaper: "Если класть ряды в другую сторону, хватит {packs} пачек",
    waste_unconfirmed: "Запас {pct}% на диагональ и ёлочку — по опыту укладчиков, ждёт проверки мастером",
  },
  norms: [
    "laminate.minOffset",
    "laminate.minLastRow",
    "laminate.expansionGap",
    "laminate.waste.diagonal",
    "laminate.waste.herringbone",
    "underlay.rollArea",
  ],
};
