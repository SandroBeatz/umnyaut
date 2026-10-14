/** Tool registry, categories, presets, norms, countries and Russian UI strings. */
export const site = {
  name: "Умняут",
  /** Canonical origin: metadata base, sitemap, JSON-LD. */
  url: "https://umnyaut.com",
  tagline: "Калькуляторы ремонта: список покупок в упаковках",
  description:
    "Введите размеры комнаты один раз — получите проверенный список покупок для всего ремонта в пачках, рулонах и мешках.",
} as const;

export { type CategoryDef, type CategorySlug, categories, reservedSegments, type WorkStep } from "./categories";
export { type CountryConfig, countries, DEFAULT_COUNTRY, getCountry } from "./countries";
export { devUi } from "./dev-ui";
export { estimatePage, roomSuggestions, workOrder } from "./estimate";
export { type ExampleItem, type HomeWork, home, type MethodIcon } from "./home";
export { itemTitle } from "./items";
export { normTitles } from "./norm-titles";
export { getNorm, type Norm, norms } from "./norms";
export { toolPath } from "./paths";
export { redirects } from "./redirects";
export {
  activeCategories,
  getCategory,
  getTool,
  itemDef,
  popularTools,
  sharedItems,
  strings,
  tools,
  toolsIn,
} from "./registry";
export { schemeStrings, toolGuides } from "./scheme";
export { methodology, navigation, shell } from "./shell";
export type { FieldDef, ItemDef, PresetDef, RoomBinding, ToolDef } from "./tools/types";
export { lengthUnitLabels, packNouns, unitLabels } from "./units";
export { MAX_MAIN_FIELDS, type RegistryInput, validateRegistry } from "./validate";
