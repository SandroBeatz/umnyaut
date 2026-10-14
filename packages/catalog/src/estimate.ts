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
    /** Saved by buying shared consumables once (one line on any screen). */
    saved: "Экономия",
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
  /** Export (P17.12) and the link without a server (P17.13, Р14). */
  export: {
    print: "Печать / PDF",
    printLabel: "Распечатать или сохранить как PDF",
    send: "Отправить",
    copy: "Скопировать",
    link: "Ссылка",
    copied: "Смета скопирована",
    linkCopied: "Ссылка скопирована — по ней смету откроют на любом устройстве",
    linkTooLong: "Смета слишком большая для ссылки — сохраните PDF",
    copyFailed: "Не получилось скопировать",
    /** Text for messengers: «Ламинат — 10 пачек — 11 200 ₽ (пол · + подложка 2 рулона)». */
    line: "{title} — {quantity}",
    lineSum: " — {sum}",
    total: "Итого: {sum}",
    open: "Открыть смету: {url}",
    /** Print header: «Смета от 13 октября 2026 · umnyaut.com». */
    printed: "Смета от {date} · {site}",
  },
  /** Someone else's estimate opened by link: view only until «Забрать себе». */
  byLink: {
    title: "Смета по ссылке",
    lead: "Только просмотр. Заберите её себе, чтобы менять и считать дальше",
    adopt: "Забрать себе",
    question: "У вас уже есть своя смета",
    questionLead: "Заменить её этой или добавить комнаты из этой сметы к своим?",
    replace: "Заменить мою",
    add: "Добавить комнаты в мою",
    cancel: "Отмена",
    adopted: "Смета теперь ваша",
    added: "Добавлено комнат: {count}",
    broken: "Ссылка на смету повреждена — откройте её заново из сообщения",
  },
  empty: {
    title: "Смета пока пустая",
    lead: "Посчитайте материал в любом калькуляторе — расчёт сам появится здесь, по комнатам.",
  },
} as const;
