/** Category slugs from docs/ui/calculator-shell-and-pages.md. A category page exists only once it has a tool. */
export interface CategoryDef {
  slug: string;
  title: string;
  /** Key in `categoryIcons` of `@umnyaut/ui`; none yet → a generic icon. */
  icon?: string;
  /** Category photo key in the image pipeline (`cat-<slug>`), once the photo exists (G06). */
  photo?: string;
}

export const categories = [
  { slug: "osnova", title: "Основа", icon: "osnova" },
  { slug: "pol", title: "Пол", icon: "pol" },
  { slug: "steny", title: "Стены", icon: "steny" },
  { slug: "plitka", title: "Плитка", icon: "plitka" },
  { slug: "potolok", title: "Потолок" },
  { slug: "elektrika", title: "Электрика" },
  { slug: "klimat", title: "Климат" },
  { slug: "strojmaterialy", title: "Стройматериалы" },
  { slug: "interer", title: "Интерьер" },
] as const satisfies readonly CategoryDef[];

export type CategorySlug = (typeof categories)[number]["slug"];

/** First-level URL segments owned by other routes; never a category slug. */
export const reservedSegments = ["remont", "spravochnik", "p", "embed", "tg", "api", "dev"] as const;
