/** Category slugs from docs/ui/calculator-shell-and-pages.md. A category page exists only once it has a tool. */
export interface CategoryDef {
  slug: string;
  title: string;
}

export const categories = [
  { slug: "osnova", title: "Основа" },
  { slug: "pol", title: "Пол" },
  { slug: "steny", title: "Стены" },
  { slug: "plitka", title: "Плитка" },
  { slug: "potolok", title: "Потолок" },
  { slug: "elektrika", title: "Электрика" },
  { slug: "klimat", title: "Климат" },
  { slug: "strojmaterialy", title: "Стройматериалы" },
  { slug: "interer", title: "Интерьер" },
] as const satisfies readonly CategoryDef[];

export type CategorySlug = (typeof categories)[number]["slug"];

/** First-level URL segments owned by other routes; never a category slug. */
export const reservedSegments = ["remont", "spravochnik", "p", "embed", "tg", "api", "dev"] as const;
