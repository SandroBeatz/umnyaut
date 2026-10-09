/** Tool registry, categories, presets, norms, countries and Russian UI strings. */
export const site = {
  name: "Умняут",
  tagline: "Калькуляторы ремонта: список покупок в упаковках",
  description:
    "Введите размеры комнаты один раз — получите проверенный список покупок для всего ремонта в пачках, рулонах и мешках.",
} as const;

export { type CategoryDef, type CategorySlug, categories, reservedSegments } from "./categories";
export { type CountryConfig, countries, DEFAULT_COUNTRY } from "./countries";
export { devUi } from "./dev-ui";
export { comingSoon, type FeatureIcon } from "./home";
export { getNorm, type Norm, norms } from "./norms";
export { activeCategories, getCategory, getTool, strings, toolPath, tools, toolsIn } from "./registry";
export type { FieldDef, ItemDef, PresetDef, ToolDef } from "./tools/types";
export { packNouns, unitLabels } from "./units";
export { MAX_MAIN_FIELDS, type RegistryInput, validateRegistry } from "./validate";
