import type { PurchaseItem } from "@umnyaut/calc";
import { packNouns, shell, unitLabels } from "@umnyaut/catalog";
import { formatNumber, formatQuantity, NBSP } from "@umnyaut/ui/format";
import { fill } from "@/shared/lib";

/** All lines of one item key: a can set (9 л + 2,7 л) comes from `compute()` as one line per size. */
export interface PurchaseGroup {
  first: PurchaseItem;
  lines: readonly PurchaseItem[];
  packs: number;
  need: number;
  leftover: number;
  /** Sold by volume or weight: the buyer needs the pack sizes, not only their number. */
  sized: boolean;
}

export function groupPurchases(items: readonly PurchaseItem[]): PurchaseGroup[] {
  const groups = new Map<string, PurchaseItem[]>();
  for (const item of items) groups.set(item.key, [...(groups.get(item.key) ?? []), item]);
  return [...groups.values()].map((lines) => {
    const first = lines[0] as PurchaseItem;
    const sum = (pick: (i: PurchaseItem) => number) => lines.reduce((total, i) => total + pick(i), 0);
    return {
      first,
      lines,
      packs: sum((i) => i.packs),
      need: sum((i) => i.need.value),
      leftover: sum((i) => i.leftover.value),
      sized: first.pack.size.unit === "l" || first.pack.size.unit === "kg",
    };
  });
}

const forms = ([one, few, many]: readonly [string, string, string]) => ({ one, few, many });
export const quantityText = (value: number, unit: keyof typeof unitLabels) =>
  `${formatNumber(value, { maxFraction: 2 })}${NBSP}${unitLabels[unit]}`;
const sizeText = (item: PurchaseItem) => quantityText(item.pack.size.value, item.pack.size.unit);

/** «1 × 9 л + 1 × 2,7 л». */
export const setText = (lines: readonly PurchaseItem[]) =>
  lines.map((line) => `${formatNumber(line.packs)}${NBSP}×${NBSP}${sizeText(line)}`).join(" + ");

/** Running-metre goods: bought length = bought area / roll width. */
export function runningLength(group: PurchaseGroup): number | undefined {
  const width = group.first.pack.width?.value;
  if (group.first.pack.kind !== "running" || !width) return undefined;
  return group.lines.reduce((sum, line) => sum + line.bought.value, 0) / width;
}

/** «1 канистра» and, for items sold by volume or weight, «по 10 л» or the set of sizes; linoleum «8,6 м». */
export function purchaseTexts(group: PurchaseGroup): { quantity: string; detail?: string } {
  const length = runningLength(group);
  const width = group.first.pack.width;
  if (length !== undefined && width) {
    return {
      quantity: quantityText(length, "m"),
      detail: fill(shell.result.width, { size: quantityText(width.value, width.unit) }),
    };
  }
  const quantity = formatQuantity(group.packs, forms(packNouns[group.first.pack.kind]));
  if (!group.sized) return { quantity };
  const detail =
    group.lines.length > 1 ? setText(group.lines) : fill(shell.result.each, { size: sizeText(group.first) });
  return { quantity, detail };
}
