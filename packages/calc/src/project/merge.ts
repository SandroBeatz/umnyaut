import { purchase } from "../blocks/packs";
import type { PurchaseItem } from "../types";

/**
 * One product in the shop (Р1): item, its variant (adhesive type, grout colour, wallpaper type), pack kind and pack
 * size. Shared-consumable prices are stored in the estimate by this key, so its spelling never changes.
 */
export function productKey(item: Pick<PurchaseItem, "key" | "variant" | "pack">): string {
  return `${item.key}|${item.variant ?? ""}|${item.pack.kind}|${item.pack.size.value}|${item.pack.size.unit}`;
}

/**
 * Merges the same product across works (tech spec §11): needs are summed first and rounded up to packs once, so
 * 0.4 + 0.4 bag buys 1 bag, not 2. A different variant or pack size stays a separate line; `main` wins over
 * `related`. Keeps first-seen order.
 */
export function mergeItems(items: readonly PurchaseItem[]): PurchaseItem[] {
  const groups = new Map<string, PurchaseItem[]>();
  for (const item of items) {
    const key = productKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()].map((group) => {
    const first = group[0] as PurchaseItem;
    if (group.length === 1) return first;
    const need = group.reduce((sum, i) => sum + i.need.value, 0);
    const role = group.some((i) => i.role === "main") ? "main" : "related";
    const extra = {
      ...(first.variant ? { variant: first.variant } : {}),
      ...(first.shopQuery ? { shopQuery: first.shopQuery } : {}),
      ...(first.nextTool ? { nextTool: first.nextTool } : {}),
    };
    return purchase(first.key, role, { value: need, unit: first.need.unit }, first.pack, extra);
  });
}
