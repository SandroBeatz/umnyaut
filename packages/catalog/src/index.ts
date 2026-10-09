/** Tool registry, categories, presets, norms, countries and Russian UI strings. */
export const site = {
  name: "Умняут",
  tagline: "Калькуляторы ремонта: список покупок в упаковках",
} as const;

export { type CategoryDef, type CategorySlug, categories, reservedSegments } from "./categories";
export { activeCategories, getCategory, getTool, strings, toolPath, tools, toolsIn } from "./registry";
export type { ToolDef } from "./tools/types";
