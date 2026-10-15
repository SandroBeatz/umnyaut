import { type PurchaseItem, productKey } from "@umnyaut/calc";
import { itemTitle, packNouns, shell, type ToolDef } from "@umnyaut/catalog";
import { quantityText, type ToolValues } from "@/entities/tool";
import { fill } from "@/shared/lib";

/** Shared consumables the list already has from other calcs, by item key, the most used product first. */
export type ListProducts = Readonly<Record<string, readonly PurchaseItem[]>>;

/** «В списке уже есть … — взять его?» under a shared consumable's block. */
export interface TakeOffer {
  text: string;
  /** The form values that pick the list's product. */
  patch: ToolValues;
}

const samePack = (a: PurchaseItem, b: PurchaseItem) =>
  a.pack.kind === b.pack.kind && a.pack.size.value === b.pack.size.value && a.pack.size.unit === b.pack.size.unit;

/**
 * The form values that pick `item`'s product (catalog `ItemDef.product`), or `undefined` when this form cannot: no
 * field for its variant, or another pack size where the tool has no pack field. `own` is the tool's item as counted
 * now (none while its block is switched off).
 */
export function productPatch(tool: ToolDef, item: PurchaseItem, own: PurchaseItem | undefined): ToolValues | undefined {
  const product = tool.items?.[item.key]?.product;
  if (!product) return undefined;
  const patch: Record<string, unknown> = {};
  if (product.variant) {
    const select = tool.fields.find((f) => f.kind === "select" && f.name === product.variant);
    if (select?.kind !== "select" || item.variant === undefined) return undefined;
    if (select.options.some((o) => o.value === item.variant)) patch[product.variant] = item.variant;
    else if (product.customName)
      Object.assign(patch, { [product.variant]: "custom", [product.customName]: item.variant });
    else return undefined;
  } else if (item.variant !== own?.variant) return undefined;
  if (product.pack) patch[product.pack] = item.pack.size.value;
  else if (own && !samePack(own, item)) return undefined;
  return patch;
}

const shows = (values: ToolValues, patch: ToolValues) => Object.entries(patch).every(([k, v]) => values[k] === v);

/** The list's product to take for one item: none when the form already shows one of the list's products. */
function offerOf(
  tool: ToolDef,
  values: ToolValues,
  list: readonly PurchaseItem[],
  own: PurchaseItem | undefined,
): { item: PurchaseItem; patch: ToolValues } | undefined {
  if (own && list.some((p) => productKey(p) === productKey(own))) return undefined;
  const takeable = list.flatMap((item) => {
    const patch = productPatch(tool, item, own);
    return patch ? [{ item, patch }] : [];
  });
  if (takeable.some((t) => shows(values, t.patch))) return undefined;
  return takeable[0];
}

/** «Плиточный клей C2TE, мешок 25 кг». */
export function productName(tool: ToolDef, item: PurchaseItem): string {
  return fill(shell.form.product, {
    title: itemTitle(item, tool.items?.[item.key]),
    pack: packNouns[item.pack.kind][0],
    size: quantityText(item.pack.size.value, item.pack.size.unit),
  });
}

/** The block (group id) a shared item's fields sit in: its price field's, else its variant field's. */
function groupOf(tool: ToolDef, key: string): string | undefined {
  const variant = tool.items?.[key]?.product?.variant;
  const field = tool.fields.find(
    (f) => (f.kind === "price" && f.item === key) || ("name" in f && variant !== undefined && f.name === variant),
  );
  return field && "group" in field ? field.group : undefined;
}

/**
 * Offers by block (spec «Калькулятор»): a shared consumable the calc buys as another product than the list has —
 * another adhesive class, grout colour or pack — gets «взять его?» with the values that switch to the list's one.
 */
export function takeOffers(
  tool: ToolDef,
  values: ToolValues,
  items: readonly PurchaseItem[],
  products: ListProducts,
): Record<string, TakeOffer> {
  const offers: Record<string, TakeOffer> = {};
  for (const key of Object.keys(tool.items ?? {})) {
    const own = items.find((i) => i.key === key);
    const group = groupOf(tool, key);
    const offer = own && group ? offerOf(tool, values, products[key] ?? [], own) : undefined;
    if (offer && group)
      offers[group] = {
        text: fill(shell.form.takeOffer, { product: productName(tool, offer.item) }),
        patch: offer.patch,
      };
  }
  return offers;
}

/**
 * What a calc not yet started takes from the list (spec «Калькулятор»: by default the product the list already
 * has): the values of every shared consumable whose product the form does not show yet. Empty when nothing changes.
 */
export function listStart(
  tool: ToolDef,
  values: ToolValues,
  items: readonly PurchaseItem[],
  products: ListProducts,
): ToolValues {
  return Object.assign(
    {},
    ...Object.keys(tool.items ?? {}).map((key) => {
      const own = items.find((i) => i.key === key);
      return offerOf(tool, values, products[key] ?? [], own)?.patch ?? {};
    }),
  );
}
