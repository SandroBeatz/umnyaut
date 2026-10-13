/**
 * Consumable variants (spec Р1, P17.4): the select options of the tools and how each variant reads in a title. A
 * variant is part of the product key, so the estimate merges only the same class, colour or kind. Sources: classes
 * by ГОСТ Р 56387-2018 / EN 12004; grout colours — the basic Ceresit CE 33 / CE 40 palette (owner, 2026-10-13).
 */

export const adhesiveClasses = [
  { value: "C1", label: "C1 — обычная плитка, стабильное основание", short: "C1" },
  { value: "C1T", label: "C1T — стены: плитка не сползает", short: "C1T" },
  { value: "C2TE", label: "C2TE — керамогранит, мозаика", short: "C2TE" },
  { value: "C2TE-S1", label: "C2TE S1 — тёплый пол, крупный формат", short: "C2TE S1" },
  { value: "C2-S2", label: "C2 S2 — сверхкрупный формат, сложное основание", short: "C2 S2" },
] as const;

export const groutColors = [
  { value: "white", label: "Белая", short: "белая" },
  { value: "light-grey", label: "Светло-серая", short: "светло-серая" },
  { value: "grey", label: "Серая", short: "серая" },
  { value: "graphite", label: "Графит", short: "графит" },
  { value: "anthracite", label: "Антрацит", short: "антрацит" },
  { value: "beige", label: "Бежевая", short: "бежевая" },
  { value: "brown", label: "Коричневая", short: "коричневая" },
  { value: "black", label: "Чёрная", short: "чёрная" },
  { value: "custom", label: "Свой цвет", short: "свой цвет" },
] as const;

/**
 * Paste coverage per pack by wallpaper kind (norms `wallpaperPaste.coverage.*`): a non-woven paste in 300 g for
 * non-woven and heavy wallpaper, a paper paste in 250 g for paper — another product, so another variant.
 */
export const wallpaperKinds = [
  { value: "nonwoven", label: "Флизелиновые", short: "для флизелиновых обоев", coverageM2: 42 },
  { value: "heavy", label: "Тяжёлые: винил, пенообои, стеклообои", short: "для тяжёлых обоев", coverageM2: 36 },
  { value: "paper", label: "Бумажные", short: "для бумажных обоев", coverageM2: 35 },
] as const;

type Variant = readonly { value: string; label: string; short: string }[];

export const options = (list: Variant) => list.map(({ value, label }) => ({ value, label }));
export const variantTitles = (list: Variant): Readonly<Record<string, string>> =>
  Object.fromEntries(list.map(({ value, short }) => [value, short]));
