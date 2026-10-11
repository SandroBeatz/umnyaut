import type { Country } from "@umnyaut/calc";

/** Country settings (tech spec §10). Static HTML is always RU; shop links arrive at stage 3. */
export interface CountryConfig {
  code: Country;
  title: string;
  currency: "RUB" | "KZT" | "BYN" | "KGS";
  /** Intl locale for numbers and money. */
  locale: string;
  /** Short sign for the header chip «RU · ₽». */
  sign: string;
  /**
   * Typical price of one pack per purchase item key («laminate» → price of a pack), shown as a hint in the
   * price field — never as a price the result uses. Filled by the owner from shop checks (C07).
   */
  typicalPrices: Readonly<Partial<Record<string, number>>>;
  /** YYYY-MM-DD the typical prices were checked; required once any price is set. */
  pricesCheckedAt?: string;
}

export const countries: readonly CountryConfig[] = [
  { code: "RU", title: "Россия", currency: "RUB", locale: "ru-RU", sign: "₽", typicalPrices: {} },
  { code: "KZ", title: "Казахстан", currency: "KZT", locale: "ru-KZ", sign: "₸", typicalPrices: {} },
  { code: "BY", title: "Беларусь", currency: "BYN", locale: "ru-BY", sign: "Br", typicalPrices: {} },
  { code: "KG", title: "Кыргызстан", currency: "KGS", locale: "ru-KG", sign: "сом", typicalPrices: {} },
];

export const DEFAULT_COUNTRY: Country = "RU";

/** Config of a country; an unknown code falls back to Russia. */
export function getCountry(code: Country): CountryConfig {
  return countries.find((c) => c.code === code) ?? (countries[0] as CountryConfig);
}
