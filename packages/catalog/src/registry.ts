import type { ToolId } from "@umnyaut/calc";
import { type CategoryDef, type CategorySlug, categories } from "./categories";
import { ploshchadKomnaty } from "./tools/ploshchad-komnaty";
import { ploshchadSten } from "./tools/ploshchad-sten";
import type { ToolDef } from "./tools/types";

/** All tools in display order. Routes, sitemap and navigation are generated from this list. */
export const tools: readonly ToolDef[] = [ploshchadKomnaty, ploshchadSten];

export const strings = {
  draftNotice: "Калькулятор скоро появится.",
} as const;

export function getTool(category: string, id: string): ToolDef | undefined {
  return tools.find((tool) => tool.category === category && tool.id === id);
}

export function getCategory(slug: string): CategoryDef | undefined {
  return categories.find((category) => category.slug === slug);
}

export function toolsIn(category: CategorySlug | string): ToolDef[] {
  return tools.filter((tool) => tool.category === category);
}

/** Categories that have at least one tool, in catalog order. */
export function activeCategories(): CategoryDef[] {
  return categories.filter((category) => toolsIn(category.slug).length > 0);
}

export function toolPath(tool: { category: CategorySlug; id: ToolId }): string {
  return `/${tool.category}/${tool.id}/`;
}
