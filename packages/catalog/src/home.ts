import type { RoomType, ToolId } from "@umnyaut/calc";

/** One material card of the example strip: the purchase item `item` of tool `tool`, computed for the room. */
export interface ExampleItem {
  tool: ToolId;
  item: string;
  /** Card title; defaults to the item's title in the tool («Ламинат»). */
  title?: string;
  /** Tool input on top of its defaults and the room («Потолок» for paint). */
  values?: Readonly<Record<string, unknown>>;
}

/** A work of the example strip and the materials it adds there. */
export interface HomeWork {
  id: string;
  items: readonly ExampleItem[];
}

/** Works of the example strip; which of them show follows the room type (`typeWorks`). */
const works: readonly HomeWork[] = [
  {
    id: "floor",
    items: [
      { tool: "laminat", item: "laminate" },
      { tool: "plintus", item: "plinth" },
    ],
  },
  { id: "walls", items: [{ tool: "oboi", item: "wallpaper" }] },
  {
    id: "ceiling",
    items: [{ tool: "kraska", item: "paint", title: "Краска, потолок", values: { surface: "ceiling" } }],
  },
  { id: "tile", items: [{ tool: "plitka", item: "tile" }] },
];

/** The example strip's works by room type: a dry room gets the four cards of the mockup, the kitchen laminate and tile, the bathroom tile. */
const typeWorks: Readonly<Record<RoomType, readonly string[]>> = {
  living: ["floor", "walls", "ceiling"],
  bedroom: ["floor", "walls", "ceiling"],
  kitchen: ["floor", "tile", "ceiling"],
  bathroom: ["tile", "ceiling"],
  hall: ["floor", "walls", "ceiling"],
  other: ["floor", "walls", "ceiling"],
};

/** Static order until usage data (P13.2); the note is the card's second line. */
const popularTools: readonly { id: ToolId; note: string }[] = [
  { id: "oboi", note: "Рулоны, полосы, клей" },
  { id: "plitka", note: "Коробки, подрезка, клей и затирка" },
  { id: "laminat", note: "Пачки, подложка, ряды" },
  { id: "kraska", note: "Литры, банки, грунтовка" },
  { id: "ploshchad-komnaty", note: "Площадь и периметр" },
  { id: "zatirka", note: "Килограммы, упаковки" },
];

/** Home page (design spec §13 «Главная», room block — `docs/ui/home-room-block.md`). */
export const home = {
  /** Part of the H1: the key phrase of the home page. */
  badge: "Калькулятор материалов для ремонта",
  titleLead: "Одна комната —",
  titleAccent: "весь список покупок",
  lead: "Введите размеры один раз — получите проверенный список покупок для всего ремонта: в пачках, рулонах и мешках.",
  mascotAlt: "Кот Умняут в рабочем комбинезоне машет лапой",
  bubble: "Привет! Я Умняут. Посчитаю, сколько купить",
  badges: ["Целые упаковки", "Без регистрации", "Ссылка на расчёт"],
  /** First state of the room block: one room, its type and sizes (owner concept, 2026-10-14). */
  room: {
    title: "Какую комнату считаем?",
    /** Room types offered as chips, in this order; «Другое» stays in the room editor. */
    types: ["living", "bedroom", "kitchen", "bathroom", "hall"] as readonly RoomType[],
    typesLabel: "Тип комнаты",
    length: "Длина",
    width: "Ширина",
    height: "Высота",
    scheme: "Схема комнаты {length} × {width} м, высота {height} м",
    floor: "Пол",
    walls: "Стены",
    ceiling: "Потолок",
    /** Row under the areas: opens the room editor (doors, windows, shape). */
    openings: "Окна и двери: {list}",
    openingsNone: "нет",
    doorForms: { one: "дверь", few: "двери", many: "дверей" },
    windowForms: { one: "окно", few: "окна", many: "окон" },
    openingsAdd: "Добавить",
    openingsEdit: "Изменить",
    openingsLabel: "{action} окна и двери",
    action: "Посчитать материалы",
    /** Popup after «Посчитать материалы»: the usual calculators of the room's type. */
    next: "Что считаем: {room}",
    nextNote: "Размеры уже в калькуляторах",
    open: "Посчитать {tool} для комнаты «{room}»",
    all: "Все расчёты",
  },
  /** Second state: the rooms of the estimate with their sums (shown once a calc is in the list). */
  rooms: {
    title: "Ваш ремонт",
    count: "{count} {rooms}",
    roomForms: { one: "комната", few: "комнаты", many: "комнат" },
    /** «19,8 м² · 3 расчёта». */
    meta: "{area} · {calcs}",
    calcForms: { one: "расчёт", few: "расчёта", many: "расчётов" },
    empty: "пока ничего не посчитано",
    more: "и ещё {count} {rooms} в списке",
    open: "{room}: открыть расчёт",
    total: "Итого по списку",
    list: "Открыть список",
    add: "Добавить комнату",
  },
  /** Room of the example when “My room” is empty: 4 × 3 м, 2,7 м, one door. */
  exampleRoom: {
    lengthMm: 4000,
    widthMm: 3000,
    heightMm: 2700,
    openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1 }],
  },
  example: {
    title: "Для комнаты {area} нужно",
    room: "{dimensions}, потолок {height}",
    door: "одна дверь",
    openings: "окон и дверей: {count}",
    retype: "Введите свои размеры — цифры пересчитаются",
    empty: "Выберите, что считаем, — здесь появится список",
    open: "Открыть расчёт: {title}",
  },
  works,
  typeWorks,
  categories: {
    title: "Строительный калькулятор: что рассчитать",
    open: "Открыть раздел",
  },
  popular: {
    title: "Популярные расчёты",
    tools: popularTools,
  },
  method: {
    title: "Как мы считаем",
    points: [
      { icon: "package", title: "Целые упаковки", text: "Пачки, рулоны и мешки — как в магазине" },
      { icon: "formula", title: "Формула с вашими числами", text: "Каждый результат раскрывается по шагам" },
      { icon: "date", title: "Дата проверки норм", text: "У расчёта указаны источник нормы и дата проверки" },
    ],
    link: "Методика расчётов",
  },
} as const;

export type MethodIcon = (typeof home.method.points)[number]["icon"];
