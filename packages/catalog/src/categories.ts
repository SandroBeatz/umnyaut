import type { ToolId } from "@umnyaut/calc";

/** One step of «Порядок работ»: what to do and the tools that compute it (alternatives side by side). */
export interface WorkStep {
  title: string;
  tools: readonly ToolId[];
}

/** Category slugs from docs/ui/calculator-shell-and-pages.md. A category page exists only once it has a tool. */
export interface CategoryDef {
  slug: string;
  title: string;
  /** Key in `categoryIcons` of `@umnyaut/ui`; none yet → a generic icon. */
  icon?: string;
  /** Category photo key in the image pipeline (`cat-<slug>`), once the photo exists (G06). */
  photo?: string;
  /** What the category holds, for its card: «Ламинат, линолеум, плинтус». */
  note?: string;
  /** «Порядок работ» on the category page; every step links to its tools. */
  steps?: readonly WorkStep[];
}

export const categories = [
  {
    slug: "osnova",
    title: "Основа",
    icon: "osnova",
    note: "Площадь комнаты и стен",
    steps: [
      { title: "Измерьте пол: площадь и периметр", tools: ["ploshchad-komnaty"] },
      { title: "Посчитайте стены без окон и дверей", tools: ["ploshchad-sten"] },
      { title: "Выберите покрытие пола", tools: ["laminat", "linoleum"] },
      { title: "Выберите отделку стен", tools: ["oboi", "kraska"] },
    ],
  },
  {
    slug: "pol",
    title: "Пол",
    icon: "pol",
    note: "Ламинат, линолеум, плинтус",
    steps: [
      { title: "Измерьте площадь и периметр пола", tools: ["ploshchad-komnaty"] },
      { title: "Посчитайте покрытие", tools: ["laminat", "linoleum"] },
      { title: "Посчитайте плинтус и фурнитуру", tools: ["plintus"] },
    ],
  },
  {
    slug: "steny",
    title: "Стены",
    icon: "steny",
    note: "Обои, краска, грунтовка",
    steps: [
      { title: "Посчитайте площадь стен без окон и дверей", tools: ["ploshchad-sten"] },
      { title: "Посчитайте обои с клеем или краску с грунтовкой", tools: ["oboi", "kraska"] },
    ],
  },
  {
    slug: "plitka",
    title: "Плитка",
    icon: "plitka",
    note: "Плитка, клей, затирка",
    steps: [
      { title: "Посчитайте плитку в коробках", tools: ["plitka"] },
      { title: "Посчитайте клей под плитку", tools: ["klej"] },
      { title: "Посчитайте затирку для швов", tools: ["zatirka"] },
    ],
  },
  { slug: "potolok", title: "Потолок" },
  { slug: "elektrika", title: "Электрика" },
  { slug: "klimat", title: "Климат" },
  { slug: "strojmaterialy", title: "Стройматериалы" },
  { slug: "interer", title: "Интерьер" },
] as const satisfies readonly CategoryDef[];

export type CategorySlug = (typeof categories)[number]["slug"];

/** First-level URL segments owned by other routes; never a category slug. */
export const reservedSegments = ["remont", "smeta", "spravochnik", "p", "embed", "tg", "api", "dev"] as const;
