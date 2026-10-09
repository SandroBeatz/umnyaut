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

/** Monotonic in area: every item present in the smaller result has at least as many packs in the larger one. */
export function growthViolations(smaller: ToolResult, larger: ToolResult): string[] {
  return smaller.items.flatMap((item) => {
    const grown = larger.items.find((i) => i.key === item.key && i.pack.size.value === item.pack.size.value);
    if (!grown) return [`${item.key}: disappeared when the area grew`];
    return grown.packs < item.packs ? [`${item.key}: ${item.packs} → ${grown.packs} packs when the area grew`] : [];
  });
}
