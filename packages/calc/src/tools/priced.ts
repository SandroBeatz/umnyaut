import { z } from "zod";
import type { Cost, PurchaseItem, ToolModule, ToolResult } from "../types";

/** How a price field is meant: per pack bought (roll, bag, box, plank) or per unit (litre of paint, m² of linoleum). */
export type PriceBasis = "pack" | "unit";

export interface PriceConfig<I> {
  /** Item keys that take a price, with the basis of the price. */
  items: Readonly<Record<string, PriceBasis>>;
  /** Area for «за м²»: a summary key of the result, or a function of the input. */
  area?: string | ((input: I) => number);
}

/** Input name of an item's price: `price_wallpaper`, `price_tile-adhesive`. */
export const priceField = (key: string) => `price_${key}`;

/**
 * Total of the purchase lines that have a price: packs × price per pack, or bought amount × price per unit.
 * `missing` lists item keys without a price («без N позиций»). No price at all → no cost.
 */
export function costOf(
  items: readonly PurchaseItem[],
  prices: Readonly<Record<string, number | undefined>>,
  basis: Readonly<Record<string, PriceBasis>>,
  areaM2?: number,
): Cost | undefined {
  let total = 0;
  let priced = 0;
  const missing = new Set<string>();
  for (const item of items) {
    const price = prices[item.key];
    if (price === undefined || !(price >= 0)) {
      missing.add(item.key);
      continue;
    }
    priced++;
    total += (basis[item.key] === "unit" ? item.bought.value : item.packs) * price;
  }
  if (priced === 0) return undefined;
  return {
    total,
    ...(areaM2 && areaM2 > 0 ? { perM2: total / areaM2 } : {}),
    missing: [...missing],
  };
}

/**
 * Adds optional pack prices to a tool: one `price_<item>` field per priced item in the input schema, and
 * `result.cost` from the lines that have a price. The formula of the tool itself is untouched.
 */
export function priced<I>(module: ToolModule<I>, config: PriceConfig<I>): ToolModule<I> {
  const keys = Object.keys(config.items);
  const shape = Object.fromEntries(keys.map((k) => [priceField(k), z.number().min(0).max(100_000_000).optional()]));
  const input = (module.input as unknown as z.ZodObject<z.ZodRawShape>).extend(shape) as unknown as z.ZodType<I>;
  return {
    ...module,
    input,
    compute(i, ctx): ToolResult {
      const result = module.compute(i, ctx);
      const values = i as unknown as Record<string, number | undefined>;
      const prices = Object.fromEntries(keys.map((k) => [k, values[priceField(k)]]));
      const area =
        typeof config.area === "function"
          ? config.area(i)
          : config.area
            ? result.summary.find((s) => s.key === config.area)?.value
            : undefined;
      const cost = costOf(result.items, prices, config.items, area);
      return cost ? { ...result, cost } : result;
    },
  };
}
