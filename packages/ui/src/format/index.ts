/** Number formatting for UI (design system: typography → numbers). Formulas never format; the UI does. */
export type Country = "RU" | "KZ" | "BY" | "KG";

export const NBSP = " ";
/** Thousands separator: thin non-breaking space («12 460 ₽»). */
export const THIN_NBSP = " ";

const CURRENCY: Record<Country, string> = { RU: "RUB", KZ: "KZT", BY: "BYN", KG: "KGS" };
const locale = (country: Country) => `ru-${country}`;

const cache = new Map<string, Intl.NumberFormat>();
function numberFormat(loc: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${loc}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    format = new Intl.NumberFormat(loc, options);
    cache.set(key, format);
  }
  return format;
}

/** Group separators become thin NBSP, the space before a currency sign becomes NBSP. */
function normalise(parts: Intl.NumberFormatPart[]): string {
  return parts
    .map((part) => {
      if (part.type === "group") return THIN_NBSP;
      if (part.type === "literal" && /^\s+$/.test(part.value)) return NBSP;
      return part.value;
    })
    .join("");
}

export interface NumberOptions {
  /** Default 2: «19,8», «0,25». */
  maxFraction?: number;
  minFraction?: number;
}

/** «12 460», «19,8», «−3». Decimal comma, thin NBSP thousands. */
export function formatNumber(value: number, { maxFraction = 2, minFraction = 0 }: NumberOptions = {}): string {
  const format = numberFormat("ru-RU", { maximumFractionDigits: maxFraction, minimumFractionDigits: minFraction });
  return normalise(format.formatToParts(value)).replace("-", "−");
}

/** «12 460 ₽», «8 500 ₸», «45 Br», «1 200 сом». Whole units unless `maxFraction` is set. */
export function formatMoney(
  value: number,
  country: Country,
  { maxFraction = 0 }: { maxFraction?: number } = {},
): string {
  const format = numberFormat(locale(country), {
    style: "currency",
    currency: CURRENCY[country],
    // `symbol`, not `narrowSymbol`: recent CLDR gives KGS the new sign ⃀ (U+20C0); the spec wants «сом».
    currencyDisplay: "symbol",
    maximumFractionDigits: maxFraction,
    minimumFractionDigits: 0,
  });
  return normalise(format.formatToParts(value)).replace("-", "−");
}

export interface PluralForms {
  one: string;
  few: string;
  many: string;
  /** Fractions: «2,5 пачки». Defaults to `few`. */
  other?: string;
}

const pluralRules = new Intl.PluralRules("ru-RU");

/** Russian plural form for `count`: 1 пачка, 2 пачки, 5 пачек, 2,5 пачки. */
export function plural(count: number, forms: PluralForms): string {
  const rule = pluralRules.select(count);
  if (rule === "one" || rule === "few" || rule === "many") return forms[rule];
  return forms.other ?? forms.few;
}

/** «10 пачек» — number and unit never wrap apart. */
export function formatQuantity(count: number, forms: PluralForms, options?: NumberOptions): string {
  return `${formatNumber(count, options)}${NBSP}${plural(count, forms)}`;
}

/** «4,6 × 4,3 × 2,7 м» — values in the given unit, joined with non-breaking spaces. */
export function formatDimensions(values: readonly number[], unit: string, options?: NumberOptions): string {
  return `${values.map((value) => formatNumber(value, options)).join(`${NBSP}×${NBSP}`)}${NBSP}${unit}`;
}
