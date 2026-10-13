import type { RoomType, ToolId } from "@umnyaut/calc";

/**
 * The estimate page's order of works, rough → finish (was P11.1): wet works first, then ceiling and walls, the floor
 * covering and its plinth last. A tool left out goes after these.
 */
export const workOrder: readonly ToolId[] = [
  "plitka",
  "klej",
  "zatirka",
  "kraska",
  "oboi",
  "linoleum",
  "laminat",
  "plintus",
  "ploshchad-komnaty",
  "ploshchad-sten",
];

/** «+ Ламинат», «+ Обои», «+ Плинтус» on a room with nothing counted yet, by the room's type (spec «Смета»). */
export const roomSuggestions: Readonly<Record<RoomType, readonly ToolId[]>> = {
  living: ["laminat", "oboi", "plintus"],
  bedroom: ["laminat", "oboi", "plintus"],
  kitchen: ["plitka", "kraska", "linoleum"],
  bathroom: ["plitka", "zatirka", "kraska"],
  hall: ["linoleum", "oboi", "plintus"],
  other: ["laminat", "oboi", "kraska"],
};

/**
 * `/smeta/` (spec «Смета», P17.11): rooms with their calcs, shared consumables, the total. Apart from `shell`, so
 * calculator pages do not carry the estimate page's strings.
 */
export const estimatePage = {
  title: "Смета ремонта",
  description: "Все расчёты по комнатам в одном списке: что, сколько и почём.",
  crumb: "Смета",
  lead: "Все расчёты по комнатам в одном списке. Хранится на этом устройстве",
  rename: "Переименовать смету",
  nameLabel: "Название сметы",
  save: "Сохранить",
  loading: "Загружаем смету",
  metrics: {
    rooms: "Комнат",
    floor: "Площадь пола",
    calcs: "Расчётов",
    saved: "Сэкономили на расходниках",
    /** The phone's narrow tile. */
    savedShort: "Экономия",
    none: "Пока нет",
  },
  /** «4,6 × 4,3 × 2,7 м · 19,8 м²». */
  roomSize: "{dimensions} · {area}",
  editRoom: "Изменить комнату «{room}»",
  /** Row caption: «пол · + подложка 2 рулона». */
  withItem: "+ {item} {quantity}",
  /** A calc whose whole purchase is a shared consumable (the «Плиточный клей» tool). */
  inShared: "в общих расходниках",
  remove: "Убрать «{calc}» из сметы",
  removed: "Расчёт убран из сметы",
  shared: {
    title: "Общие расходники",
    lead: "на все комнаты сразу",
    /** «Ванная, Кухня · вместо 8». */
    instead: "вместо {count}",
    saving: "{items} одной партией — на {saved} дешевле, чем по комнатам",
    savingPacks: "{items} одной партией — на {count} {packs} меньше, чем по комнатам",
    packs: { one: "упаковку", few: "упаковки", many: "упаковок" },
  },
  /** A room with nothing counted yet: dashed card with the usual works of its type. */
  emptyRoom: "пока ничего не посчитано",
  suggest: "+ {tool}",
  suggestLabel: "Посчитать {tool} для комнаты «{room}»",
  addRoom: "Комната",
  total: {
    title: "Итого по смете",
    shared: "Общие расходники",
    /** No price typed anywhere yet. */
    noPrices: "Цены вводятся в калькуляторах — тогда появится сумма",
  },
  empty: {
    title: "Смета пока пустая",
    lead: "Посчитайте материал в любом калькуляторе — расчёт сам появится здесь, по комнатам.",
  },
} as const;
