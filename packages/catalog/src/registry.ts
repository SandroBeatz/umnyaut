import { type CategoryDef, type CategorySlug, categories } from "./categories";
import { home } from "./home";
import { klej } from "./tools/klej";
import { kraska } from "./tools/kraska";
import { laminat } from "./tools/laminat";
import { linoleum } from "./tools/linoleum";
import { oboi } from "./tools/oboi";
import { plintus } from "./tools/plintus";
import { plitka } from "./tools/plitka";
import { ploshchadKomnaty } from "./tools/ploshchad-komnaty";
import { ploshchadSten } from "./tools/ploshchad-sten";
import type { ItemDef, ToolDef } from "./tools/types";
import { zatirka } from "./tools/zatirka";

/** All tools in display order. Routes, sitemap and navigation are generated from this list. */
export const tools: readonly ToolDef[] = [
  ploshchadKomnaty,
  ploshchadSten,
  oboi,
  kraska,
  laminat,
  plintus,
  linoleum,
  plitka,
  klej,
  zatirka,
];

export const strings = {
  draftNotice: "Калькулятор скоро появится.",
} as const;

/** Item keys of the shared consumables (`ItemDef.shared`): the estimate merges them across rooms. */
export const sharedItems: ReadonlySet<string> = new Set(
  tools.flatMap((t) => Object.entries(t.items ?? {}).flatMap(([key, item]) => (item.shared ? [key] : []))),
);

/** An item's display data from whichever tool describes it (the estimate shows items of every tool). */
export function itemDef(key: string): ItemDef | undefined {
  return tools.find((t) => t.items?.[key])?.items?.[key];
}

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

/** Popular tools of the home and 404 pages with their card note; a tool that is not live is skipped. */
export function popularTools(): { tool: ToolDef; note: string }[] {
  return home.popular.tools.flatMap(({ id, note }) => {
    const tool = tools.find((t) => t.id === id && t.status === "live");
    return tool ? [{ tool, note }] : [];
  });
}
