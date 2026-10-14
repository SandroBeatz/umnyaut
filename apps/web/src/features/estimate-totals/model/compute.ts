import {
  aggregateEstimate,
  type Estimate,
  type EstimateAggregate,
  type EstimateCalc,
  type EstimateTotals,
  type PurchaseItem,
  productKey,
  type ToolId,
  type ToolModule,
  upgradeInput,
} from "@umnyaut/calc";
import { itemDef, itemTitle, packNouns, sharedItems, shell, tools } from "@umnyaut/catalog";
import { plural } from "@umnyaut/ui/format";
import { applyRoom } from "@/entities/room";
import { groupPurchases, purchaseTexts, quantityText, type ToolValues } from "@/entities/tool";
import { fill } from "@/shared/lib";

export type ModuleOf = (id: ToolId) => ToolModule<ToolValues> | undefined;

/**
 * A calc's items in its own room, as its calculator counts them: defaults → its input → the room's sizes; pack
 * prices from the tool's price fields. `undefined` when the module is not loaded or the input no longer fits.
 */
export function calcItems(
  estimate: Estimate,
  calc: EstimateCalc,
  moduleOf: ModuleOf,
):
  | {
      items: readonly PurchaseItem[];
      prices: Record<string, number>;
      priceBasis?: Readonly<Record<string, "pack" | "unit">>;
    }
  | undefined {
  const tool = tools.find((t) => t.id === calc.tool);
  const module = moduleOf(calc.tool as ToolId);
  if (!tool || !module) return undefined;
  const room = estimate.rooms.find((r) => r.id === calc.roomId) ?? null;
  const ctx = { country: estimate.country };
  const parsed = module.input.safeParse(
    applyRoom({ ...module.defaults(ctx), ...upgradeInput(module, calc.input) }, room, tool.fields),
  );
  if (!parsed.success) return undefined;
  const values = parsed.data as ToolValues;
  const prices = Object.fromEntries(
    tool.fields.flatMap((f) => {
      const price = f.kind === "price" ? values[f.name] : undefined;
      return f.kind === "price" && typeof price === "number" && price > 0 ? [[f.item, price]] : [];
    }),
  );
  return {
    items: module.compute(values, ctx).items,
    prices,
    ...(module.priceBasis ? { priceBasis: module.priceBasis } : {}),
  };
}

/**
 * The estimate of the calcs `include` picks: room lines, shared consumables merged once, totals. A shared
 * consumable's pack price is the estimate's (Р2); a price typed in a calculator stands in until the estimate has one.
 */
export function computeEstimate(
  estimate: Estimate,
  moduleOf: ModuleOf,
  include: (calc: EstimateCalc) => boolean,
): EstimateAggregate {
  const typed: Record<string, number> = {};
  const calcs = estimate.calcs.filter(include).flatMap((calc) => {
    const counted = calcItems(estimate, calc, moduleOf);
    if (!counted) return [];
    for (const item of counted.items) {
      const price = counted.prices[item.key];
      if (sharedItems.has(item.key) && price !== undefined) typed[productKey(item)] ??= price;
    }
    return [
      {
        id: calc.id,
        roomId: calc.roomId,
        ...(calc.surface ? { surface: calc.surface } : {}),
        items: counted.items,
        prices: { ...counted.prices, ...calc.prices },
        ...(counted.priceBasis ? { priceBasis: counted.priceBasis } : {}),
      },
    ];
  });
  return aggregateEstimate({
    roomIds: estimate.rooms.map((r) => r.id),
    calcs,
    shared: sharedItems,
    prices: { ...typed, ...estimate.prices },
  });
}

/** The totals the header shows: calcs in the estimate only (drafts below the threshold do not count). */
export function totalsOf(aggregate: EstimateAggregate): Omit<EstimateTotals, "at"> {
  const { sum, byRoom, saved, missing } = aggregate.totals;
  return { sum, byRoom, saved, missing };
}

/** A shared consumable as the calculator shows it: the estimate's quantity, this calc's share, the saving. */
export interface SharedItemView {
  /** «7 мешков» for the whole estimate. */
  total: string;
  /** «Ванная: 104,6 кг» — what this calc needs. */
  share: string;
  /** «Плиточный клей на весь список: 7 мешков вместо 8 — общий с «Кухня»», when merging saved packs. */
  saving?: string;
}

const forms = ([one, few, many]: readonly [string, string, string]) => ({ one, few, many });

/** Shared consumables of one calc in the estimate, by item key. */
export function sharedOf(
  aggregate: EstimateAggregate,
  estimate: Estimate,
  calcId: string,
): Record<string, SharedItemView> {
  const roomName = (id: string) => estimate.rooms.find((r) => r.id === id)?.name ?? "";
  const own = estimate.calcs.find((c) => c.id === calcId);
  const keys = [
    ...new Set(aggregate.shared.filter((l) => l.shares.some((s) => s.calcId === calcId)).map((l) => l.item.key)),
  ];
  return Object.fromEntries(
    keys.map((key) => {
      const lines = aggregate.shared.filter((l) => l.item.key === key && l.shares.some((s) => s.calcId === calcId));
      const [group] = groupPurchases(lines.map((l) => l.item));
      const first = lines[0];
      const shares = lines.flatMap((l) => l.shares);
      const need = shares.filter((s) => s.calcId === calcId).reduce((n, s) => n + s.need, 0);
      const separate = lines.reduce((n, l) => n + l.separatePacks, 0);
      const saved = lines.reduce((n, l) => n + l.savedPacks, 0);
      const total = group ? purchaseTexts(group).quantity : "";
      const others = [...new Set(shares.filter((s) => s.roomId !== own?.roomId).map((s) => roomName(s.roomId)))];
      const title = first ? itemTitle(first.item, itemDef(key)) : key;
      const view: SharedItemView = {
        total,
        share: fill(shell.result.share, {
          room: roomName(own?.roomId ?? ""),
          need: first ? quantityText(need, first.item.need.unit) : "",
        }),
      };
      if (saved > 0 && first) {
        const instead = `${separate} ${plural(separate, forms(packNouns[first.item.pack.kind]))}`;
        view.saving = fill(others.length > 0 ? shell.result.savingWith : shell.result.saving, {
          item: title,
          total,
          instead,
          rooms: others.join("», «"),
        });
      }
      return [key, view];
    }),
  );
}
