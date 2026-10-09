import { purchase } from "../blocks/packs";
import type { PurchaseItem } from "../types";

const mergeKey = (item: PurchaseItem) => `${item.key}|${item.pack.kind}|${item.pack.size.value}|${item.pack.size.unit}`;

/**
 * Merges the same item in the same pack across works (planner, tech spec §11): needs are summed first and
 * rounded up to packs once, so 0.4 + 0.4 bag buys 1 bag, not 2. A different pack size stays a separate line;
 * `main` wins over `related`.
 *
 * Stub for P4.9: keeps first-seen order. P11.1 adds sorting by work order (rough → finish).
 */
export function mergeItems(items: readonly PurchaseItem[]): PurchaseItem[] {
  const groups = new Map<string, PurchaseItem[]>();
  for (const item of items) {
    const key = mergeKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()].map((group) => {
    const first = group[0] as PurchaseItem;
    if (group.length === 1) return first;
    const need = group.reduce((sum, i) => sum + i.need.value, 0);
    const role = group.some((i) => i.role === "main") ? "main" : "related";
    const extra = {
      ...(first.shopQuery ? { shopQuery: first.shopQuery } : {}),
      ...(first.nextTool ? { nextTool: first.nextTool } : {}),
    };
    return purchase(first.key, role, { value: need, unit: first.need.unit }, first.pack, extra);
  });
}
