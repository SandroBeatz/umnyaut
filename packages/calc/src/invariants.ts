import type { ToolResult } from "./types";

/** Paths of numbers that are NaN or ±Infinity anywhere in the value. */
export function nonFiniteNumbers(value: unknown, path = "result"): string[] {
  if (typeof value === "number") return Number.isFinite(value) ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => nonFiniteNumbers(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => nonFiniteNumbers(v, `${path}.${k}`));
  }
  return [];
}

/** Tolerance for bought ≥ need: bought is packs × size, so float noise of a few ulps is allowed. */
const SLACK = 1e-9;

/** Invariants of any result (tech spec §5): integer packs, bought ≥ need, no negative leftover, all numbers finite. */
export function resultViolations(result: ToolResult): string[] {
  const errors = nonFiniteNumbers(result).map((path) => `${path} is not finite`);
  for (const item of result.items) {
    if (!Number.isInteger(item.packs) || item.packs < 0)
      errors.push(`${item.key}: packs ${item.packs} is not a whole number`);
    if (item.bought.value < item.need.value * (1 - SLACK)) {
      errors.push(`${item.key}: bought ${item.bought.value} < need ${item.need.value}`);
    }
    if (item.leftover.value < 0) errors.push(`${item.key}: negative leftover ${item.leftover.value}`);
  }
  return errors;
}

/** Total bought per item key: a can set has several lines with one key (paint 9 л + 2,7 л). */
function boughtByKey(result: ToolResult): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of result.items) totals.set(item.key, (totals.get(item.key) ?? 0) + item.bought.value);
  return totals;
}

/**
 * Monotonic in area: every item key present in the smaller result is bought in at least the same amount in
 * the larger one. Compared per key, not per pack size, because a can set may swap 3 × 0,9 л for 1 × 2,7 л.
 */
export function growthViolations(smaller: ToolResult, larger: ToolResult): string[] {
  const grown = boughtByKey(larger);
  return [...boughtByKey(smaller)].flatMap(([key, bought]) => {
    const after = grown.get(key);
    if (after === undefined) return [`${key}: disappeared when the area grew`];
    return after < bought * (1 - SLACK) ? [`${key}: bought ${bought} → ${after} when the area grew`] : [];
  });
}
