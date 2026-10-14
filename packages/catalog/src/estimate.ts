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
 * `/spisok/` (spec «Смета» — in the UI «Список покупок» since 2026-10-14, P17.11): rooms with their calcs, shared consumables, the total. Apart from `shell`, so
 * calculator pages do not carry the estimate page's strings.
 */
export const estimatePage = {
  title: "Список покупок",
  description: "Все расчёты по комнатам в одном списке: что, сколько и почём.",
  crumb: "Список покупок",
  lead: "Все расчёты по комнатам в одном списке. Хранится на этом устройстве",
  rename: "Переименовать список",
  nameLabel: "Название списка",
  save: "Сохранить",
  loading: "Загружаем список",
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
  remove: "Убрать «{calc}» из списка",
  removed: "Расчёт убран из списка",
  /** The row's trash asks first. */
  removeConfirm: "Убрать «{calc}» из списка?",
  removeYes: "Убрать",
  removeNo: "Отмена",
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
    title: "Итого по списку",
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
    copied: "Список скопирован",
    linkCopied: "Ссылка скопирована — по ней список откроют на любом устройстве",
    linkTooLong: "Список слишком большой для ссылки — сохраните PDF",
    copyFailed: "Не получилось скопировать",
    /** Text for messengers: «Ламинат — 10 пачек — 11 200 ₽ (пол · + подложка 2 рулона)». */
    line: "{title} — {quantity}",
    lineSum: " — {sum}",
    total: "Итого: {sum}",
    open: "Открыть список: {url}",
    /** Print header: «Список покупок от 13 октября 2026 · umnyaut.com». */
    printed: "Список покупок от {date} · {site}",
  },
  /** Someone else's estimate opened by link: view only until «Забрать себе». */
  byLink: {
    title: "Список по ссылке",
    lead: "Только просмотр. Заберите его себе, чтобы менять и считать дальше",
    adopt: "Забрать себе",
    question: "У вас уже есть свой список",
    questionLead: "Заменить его этим или добавить комнаты из этого списка к своим?",
    replace: "Заменить мою",
    add: "Добавить комнаты в мою",
    cancel: "Отмена",
    adopted: "Список теперь ваш",
    added: "Добавлено комнат: {count}",
    broken: "Ссылка на список повреждена — откройте её заново из сообщения",
  },
  empty: {
    title: "Список пока пустой",
    lead: "Посчитайте материал в любом калькуляторе — расчёт сам появится здесь, по комнатам.",
  },
} as const;
