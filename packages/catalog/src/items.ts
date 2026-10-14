import type { ItemDef } from "./tools/types";

/**
 * A purchase item's name with its variant (spec Р1): «Затирка белая», «Плиточный клей C1T», «Обойный клей для
 * бумажных обоев»; a variant the catalog does not list (a colour the user typed) is shown as it is. Takes the item's
 * definition (`tool.items[key]`, or `itemDef(key)` across tools), so a calculator page needs no tool registry.
 */
export function itemTitle(item: { key: string; variant?: string | undefined }, def: ItemDef | undefined): string {
  const title = def?.title ?? item.key;
  return item.variant ? `${title} ${def?.variants?.[item.variant] ?? item.variant}` : title;
}
