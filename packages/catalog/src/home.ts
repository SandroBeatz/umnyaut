import type { ToolId } from "@umnyaut/calc";

/** One material card of the example strip: the purchase item `item` of tool `tool`, computed for the room. */
export interface ExampleItem {
  tool: ToolId;
  item: string;
  /** Card title; defaults to the item's title in the tool («Ламинат»). */
  title?: string;
  /** Tool input on top of its defaults and the room («Потолок» for paint). */
  values?: Readonly<Record<string, unknown>>;
}

/** A work chip of the “My room” card and the materials it adds to the example strip. */
export interface HomeWork {
  id: string;
  label: string;
  /** Selected when the page opens. */
  selected: boolean;
  items: readonly ExampleItem[];
}

/** Work chips of “My room”; the default selection gives the four cards of the mockup. */
const works: readonly HomeWork[] = [
  {
    id: "floor",
    label: "Пол",
    selected: true,
    items: [
      { tool: "laminat", item: "laminate" },
      { tool: "plintus", item: "plinth" },
    ],
  },
  { id: "walls", label: "Стены", selected: true, items: [{ tool: "oboi", item: "wallpaper" }] },
  {
    id: "ceiling",
    label: "Потолок",
    selected: true,
    items: [{ tool: "kraska", item: "paint", title: "Краска, потолок", values: { surface: "ceiling" } }],
  },
  { id: "tile", label: "Плитка", selected: false, items: [{ tool: "plitka", item: "tile" }] },
];

/** Static order until usage data (P13.2); the note is the card's second line. */
const popularTools: readonly { id: ToolId; note: string }[] = [
  { id: "oboi", note: "Рулоны, полосы, клей" },
  { id: "plitka", note: "Коробки, подрезка, клей и затирка" },
  { id: "laminat", note: "Пачки, подложка, ряды" },
  { id: "kraska", note: "Литры, банки, грунтовка" },
  { id: "ploshchad-komnaty", note: "Площадь и периметр" },
  { id: "zatirka", note: "Килограммы, упаковки" },
];

/** Home page (design spec §13 «Главная»). Until the planner the orange button picks a category. */
export const home = {
  badge: "Ремонт начинается с правильного расчёта",
  titleLead: "Одна комната —",
  titleAccent: "весь список покупок",
  lead: "Введите размеры один раз — получите проверенный список покупок для всего ремонта: в пачках, рулонах и мешках.",
  mascotAlt: "Кот Умняут в рабочем комбинезоне машет лапой",
  bubble: "Привет! Я Умняут. Посчитаю, сколько купить",
  badges: ["Целые упаковки", "Без регистрации", "Ссылка на расчёт"],
  room: {
    title: "Моя комната",
    note: "Размеры подставятся во все калькуляторы",
    length: "Длина",
    width: "Ширина",
    height: "Высота",
    works: "Что считаем",
    /** «Рассчитать ремонт» once the planner exists (P11.5). */
    action: "Выбрать расчёт",
    scheme: "Схема комнаты {length} × {width} м, высота {height} м",
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
  categories: {
    title: "Выберите, что нужно рассчитать",
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
