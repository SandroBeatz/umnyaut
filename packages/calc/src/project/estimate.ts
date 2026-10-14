import type { PurchaseItem } from "../types";
import { mergeItems, productKey } from "./merge";
import type { Surface } from "./schema";

/** A room's surface; a calc's `Surface` is one or two of them. */
export type SurfacePart = "floor" | "walls" | "ceiling";

const PARTS: Readonly<Record<Surface, readonly SurfacePart[]>> = {
  floor: ["floor"],
  walls: ["walls"],
  ceiling: ["ceiling"],
  "floor-walls": ["floor", "walls"],
  "walls-ceiling": ["walls", "ceiling"],
};

export function surfaceParts(surface: Surface): readonly SurfacePart[] {
  return PARTS[surface];
}

/** Parts both surfaces cover; a calc without a surface is taken to cover all of them. */
function sharedParts(a?: Surface, b?: Surface): SurfacePart[] {
  const all: SurfacePart[] = ["floor", "walls", "ceiling"];
  const pa = a ? PARTS[a] : all;
  const pb = b ? PARTS[b] : all;
  return pa.filter((p) => pb.includes(p));
}

/**
 * `by` covers every part of `of`: an adhesive on «Пол» does not cover tile on «Пол и стены» — dropping that tile's
 * adhesive would lose the walls' share. A calc without a surface covers anything.
 */
function covers(by?: Surface, of?: Surface): boolean {
  if (!by) return true;
  if (!of) return false;
  return PARTS[of].every((p) => PARTS[by].includes(p));
}

/** One calc already computed by the browser: its items for the room as it is now. */
export interface EstimateCalcItems {
  id: string;
  roomId: string;
  surface?: Surface;
  items: readonly PurchaseItem[];
  /** Main-material price by item key: per pack, or per unit bought where `priceBasis` says so. */
  prices?: Readonly<Record<string, number>>;
  /** «unit» — the price is per m² or litre bought (linoleum, paint): a line costs bought amount × price. */
  priceBasis?: Readonly<Record<string, "pack" | "unit">>;
}

export interface AggregateInput {
  /** Estimate order of rooms; calcs of a room keep their order. */
  roomIds: readonly string[];
  calcs: readonly EstimateCalcItems[];
  /** Item keys the catalog marks `shared`: consumables bought once for the whole renovation. */
  shared: ReadonlySet<string>;
  /** Shared-consumable pack price by product key (Р2). */
  prices: Readonly<Record<string, number>>;
}

export interface EstimateLine {
  calcId: string;
  item: PurchaseItem;
  price?: number;
  /** packs × price; none without a price. */
  cost?: number;
}

export interface EstimateRoomLines {
  roomId: string;
  lines: EstimateLine[];
  /** Priced lines only. */
  sum: number;
  missing: number;
}

export interface SharedShare {
  calcId: string;
  roomId: string;
  need: number;
  /** What the calc would buy alone. */
  packs: number;
}

export interface SharedLine {
  productKey: string;
  /** Needs of every share summed and rounded to packs once. */
  item: PurchaseItem;
  shares: SharedShare[];
  /** Packs the shares would buy one by one. */
  separatePacks: number;
  /** separatePacks − item.packs, never negative. */
  savedPacks: number;
  price?: number;
  cost?: number;
  saved?: number;
}

/** Two calcs of a room lay a finish on the same surface (tile on «Пол и стены» and on «Пол»; wallpaper and paint). */
export interface Overlap {
  roomId: string;
  calcIds: readonly [string, string];
  parts: readonly SurfacePart[];
}

/** A consumable a calc brought along that another calc of the room counts itself (Р11). */
export interface Replacement {
  calcId: string;
  by: string;
  key: string;
}

export interface EstimateAggregate {
  rooms: EstimateRoomLines[];
  shared: SharedLine[];
  overlaps: Overlap[];
  replaced: Replacement[];
  totals: {
    sum: number;
    byRoom: Record<string, number>;
    /** Money saved by merging priced shared lines. */
    saved: number;
    savedPacks: number;
    missing: number;
  };
}

const priced = (packs: number, price: number | undefined) =>
  price === undefined ? {} : { price, cost: packs * price };

/** A calc lays a finish when it has a surface and a main item of its own that is not a shared consumable. */
const finishes = (calc: EstimateCalcItems, shared: ReadonlySet<string>) =>
  calc.surface !== undefined && calc.items.some((i) => i.role === "main" && !shared.has(i.key));

/**
 * The estimate (spec «Общие расходники», «Смета»): main materials stay with their room line by line; shared
 * consumables of all rooms are summed per product key and rounded to packs once, each calc's share kept. A calc that
 * counts a consumable itself (adhesive, grout) replaces the same consumable another calc of the room brings along on
 * a surface it covers whole; covering only part of it (adhesive on the floor, tile on floor and walls), both stay —
 * a little extra rather than the walls' share lost. Pure: the browser computes each calc and passes its items.
 */
export function aggregateEstimate({ roomIds, calcs, shared, prices }: AggregateInput): EstimateAggregate {
  const replaced: Replacement[] = [];
  const overlaps: Overlap[] = [];
  const kept = new Map<string, PurchaseItem[]>();

  for (const roomId of roomIds) {
    const inRoom = calcs.filter((c) => c.roomId === roomId);
    for (const calc of inRoom) {
      const items = calc.items.filter((item) => {
        if (item.role === "main") return true;
        const by = inRoom.find(
          (o) =>
            o !== calc &&
            o.items.some((i) => i.role === "main" && i.key === item.key) &&
            covers(o.surface, calc.surface),
        );
        if (!by) return true;
        if (!replaced.some((r) => r.calcId === calc.id && r.key === item.key))
          replaced.push({ calcId: calc.id, by: by.id, key: item.key });
        return false;
      });
      kept.set(calc.id, items);
    }
    const laying = inRoom.filter((c) => finishes(c, shared));
    for (const [i, a] of laying.entries()) {
      for (const b of laying.slice(i + 1)) {
        const parts = sharedParts(a.surface, b.surface);
        if (parts.length > 0) overlaps.push({ roomId, calcIds: [a.id, b.id], parts });
      }
    }
  }

  const rooms = roomIds.map((roomId): EstimateRoomLines => {
    const lines = calcs
      .filter((c) => c.roomId === roomId)
      .flatMap((calc) =>
        (kept.get(calc.id) ?? [])
          .filter((item) => !shared.has(item.key))
          .map(
            (item): EstimateLine => ({
              calcId: calc.id,
              item,
              ...priced(
                calc.priceBasis?.[item.key] === "unit" ? item.bought.value : item.packs,
                calc.prices?.[item.key],
              ),
            }),
          ),
      );
    return {
      roomId,
      lines,
      sum: lines.reduce((n, l) => n + (l.cost ?? 0), 0),
      missing: lines.filter((l) => l.cost === undefined).length,
    };
  });

  const byKey = new Map<string, SharedShare[]>();
  const sharedItems: PurchaseItem[] = [];
  for (const roomId of roomIds) {
    for (const calc of calcs.filter((c) => c.roomId === roomId)) {
      for (const item of (kept.get(calc.id) ?? []).filter((i) => shared.has(i.key))) {
        const key = productKey(item);
        byKey.set(key, [
          ...(byKey.get(key) ?? []),
          { calcId: calc.id, roomId, need: item.need.value, packs: item.packs },
        ]);
        sharedItems.push(item);
      }
    }
  }
  const sharedLines = mergeItems(sharedItems).map((item): SharedLine => {
    const key = productKey(item);
    const shares = byKey.get(key) ?? [];
    const separatePacks = shares.reduce((n, s) => n + s.packs, 0);
    const savedPacks = Math.max(separatePacks - item.packs, 0);
    const price = prices[key];
    return {
      productKey: key,
      item,
      shares,
      separatePacks,
      savedPacks,
      ...priced(item.packs, price),
      ...(price === undefined ? {} : { saved: savedPacks * price }),
    };
  });

  const sharedSum = sharedLines.reduce((n, l) => n + (l.cost ?? 0), 0);
  return {
    rooms,
    shared: sharedLines,
    overlaps,
    replaced,
    totals: {
      sum: rooms.reduce((n, r) => n + r.sum, 0) + sharedSum,
      byRoom: Object.fromEntries(rooms.map((r) => [r.roomId, r.sum])),
      saved: sharedLines.reduce((n, l) => n + (l.saved ?? 0), 0),
      savedPacks: sharedLines.reduce((n, l) => n + l.savedPacks, 0),
      missing: rooms.reduce((n, r) => n + r.missing, 0) + sharedLines.filter((l) => l.cost === undefined).length,
    },
  };
}
