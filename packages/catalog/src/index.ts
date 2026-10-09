/** Tool registry, categories, presets, norms, countries and Russian UI strings. */
export const site = {
  name: "Умняут",
  tagline: "Калькуляторы ремонта: список покупок в упаковках",
  description:
    "Введите размеры комнаты один раз — получите проверенный список покупок для всего ремонта в пачках, рулонах и мешках.",
} as const;

export { type CategoryDef, type CategorySlug, categories, reservedSegments } from "./categories";
export { devUi } from "./dev-ui";
export { comingSoon, type FeatureIcon } from "./home";
export { activeCategories, getCategory, getTool, strings, toolPath, tools, toolsIn } from "./registry";
export type { ToolDef } from "./tools/types";
