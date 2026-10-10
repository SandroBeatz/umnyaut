import type { Pack, PurchaseItem, Quantity } from "../types";

/** Relative tolerance: absorbs float noise such as 0.1 × 3 / 0.1 = 3.0000000000000004. */
export const PACK_EPSILON = 1e-9;

/**
 * Packages needed to cover `need` with packs of `size`, always rounded up.
 * A ratio within 1e-9 (relative) of an integer counts as that integer, so float noise never adds a pack.
 */
export function ceilPacks(need: number, size: number): number {
  if (!(need > 0) || !(size > 0)) return 0;
  const ratio = need / size;
  const nearest = Math.round(ratio);
  // Relative to the ratio itself: a tiny real need (1e-9 l) still buys one pack.
  if (nearest > 0 && Math.abs(ratio - nearest) <= PACK_EPSILON * ratio) return nearest;
  // need > 0 here, so at least one pack even if the ratio underflows to 0.
  return Math.max(Math.ceil(ratio), 1);
}

/** Builds a purchase line: packs via `ceilPacks`, bought = packs × size, leftover = bought − need. */
export function purchase(
  key: string,
  role: PurchaseItem["role"],
  need: Quantity,
  pack: Pack,
  extra: Pick<PurchaseItem, "shopQuery" | "nextTool"> = {},
): PurchaseItem {
  const packs = ceilPacks(need.value, pack.size.value);
  const bought = packs * pack.size.value;
  return {
    key,
    role,
    need,
    pack,
    packs,
    bought: { value: bought, unit: need.unit },
    leftover: { value: Math.max(bought - need.value, 0), unit: need.unit },
    ...extra,
  };
}

export interface PackOption {
  /** Amount one pack holds, in the need's unit (e.g. litres). */
  size: number;
  /** Price of one pack; when every option has one, the cheapest set wins instead of the smallest overpay. */
  price?: number;
}

export interface PackSet {
  /** Pack count per option, same order as the input options. */
  counts: number[];
  total: number;
  price?: number;
}

/** Precision of the can-set search: amounts are compared in 1/1000 of a unit (ml for litres). */
const SET_SCALE = 1000;
/** Search ceiling in gcd steps; beyond it the optimiser buys the largest pack only. */
const SET_MAX_STEPS = 1_000_000;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Best set of packs of different sizes covering `need` (paint cans 0.9 / 2.7 / 9 l).
 * Minimises the price when every option has one, otherwise the bought amount (overpay);
 * ties go to fewer packs. Exact dynamic programming over amounts in gcd steps of the pack sizes.
 */
export function bestPackSet(need: number, options: readonly PackOption[]): PackSet {
  const usePrice = options.length > 0 && options.every((o) => typeof o.price === "number" && o.price >= 0);
  const counts = options.map(() => 0);
  const valid = options
    .map((o, i) => ({ i, size: o.size, price: o.price ?? 0, units: Math.round(o.size * SET_SCALE) }))
    .filter((o) => o.units > 0);
  const result = () => ({
    counts,
    total: valid.reduce((sum, o) => sum + (counts[o.i] as number) * o.size, 0),
    ...(usePrice ? { price: valid.reduce((sum, o) => sum + (counts[o.i] as number) * o.price, 0) } : {}),
  });
  if (!(need > 0) || valid.length === 0) return result();

  const step = valid.reduce((g, o) => gcd(g, o.units), 0);
  const sizes = valid.map((o) => o.units / step);
  // 1e-6 absorbs float noise in need × 1000 (2.7 × 1000 = 2700.0000000000005).
  const needSteps = Math.ceil(Math.ceil(need * SET_SCALE - 1e-6) / step);
  const limit = needSteps + Math.max(...sizes);
  if (limit > SET_MAX_STEPS) {
    const largest = valid.reduce((a, b) => (b.units > a.units ? b : a));
    counts[largest.i] = ceilPacks(need, largest.size);
    return result();
  }

  // cost[a]: best price (or amount) reaching exactly `a` steps; count[a]: packs used; last[a]: option added last.
  const cost = new Float64Array(limit + 1).fill(Number.POSITIVE_INFINITY);
  const count = new Int32Array(limit + 1);
  const last = new Int32Array(limit + 1).fill(-1);
  cost[0] = 0;
  const better = (c: number, n: number, a: number) =>
    c < (cost[a] as number) - 1e-9 || (Math.abs(c - (cost[a] as number)) <= 1e-9 && n < (count[a] as number));

  // Plain loops: this runs up to SET_MAX_STEPS × options times, a closure per step is too slow.
  const stepCost = valid.map((o, k) => (usePrice ? o.price : (sizes[k] as number)));
  for (let a = 1; a <= limit; a++) {
    for (let k = 0; k < sizes.length; k++) {
      const s = sizes[k] as number;
      if (s > a) continue;
      const prev = cost[a - s] as number;
      if (prev === Number.POSITIVE_INFINITY) continue;
      const c = prev + (stepCost[k] as number);
      const n = (count[a - s] as number) + 1;
      if (better(c, n, a)) {
        cost[a] = c;
        count[a] = n;
        last[a] = k;
      }
    }
  }

  let best = -1;
  for (let a = needSteps; a <= limit; a++) {
    if (cost[a] === Number.POSITIVE_INFINITY) continue;
    if (best < 0 || better(cost[a] as number, count[a] as number, best)) best = a;
  }
  for (let a = best; a > 0; a -= sizes[last[a] as number] as number) {
    const option = valid[last[a] as number] as (typeof valid)[number];
    counts[option.i] = (counts[option.i] as number) + 1;
  }
  return result();
}

/**
 * Purchase lines for the best set of different pack sizes (paint 0,9 / 2,7 / 9 л): one line per size used,
 * largest first, all with the same `key`. The need is split largest first, so every line still goes
 * through `ceilPacks`; the set is optimal, so no line could drop a pack. Nothing needed → no lines.
 */
export function purchaseSet(
  key: string,
  role: PurchaseItem["role"],
  need: Quantity,
  kind: Pack["kind"],
  sizes: readonly number[],
): PurchaseItem[] {
  const set = bestPackSet(
    need.value,
    sizes.map((size) => ({ size })),
  );
  const lines = sizes
    .map((size, i) => ({ size, count: set.counts[i] as number }))
    .filter((line) => line.count > 0)
    .sort((a, b) => b.size - a.size);
  let rest = need.value;
  return lines.map(({ size, count }, i) => {
    const part = i === lines.length - 1 ? rest : Math.min(rest, count * size);
    rest -= part;
    return purchase(key, role, { value: part, unit: need.unit }, { kind, size: { value: size, unit: need.unit } });
  });
}
