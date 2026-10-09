import type { Country } from "@umnyaut/calc";

/** Skeleton for P7.6 (C07 adds price hints and shop links). Static HTML is always RU. */
export interface CountryConfig {
  code: Country;
  title: string;
  currency: "RUB" | "KZT" | "BYN" | "KGS";
  /** Intl locale for numbers and money. */
  locale: string;
}

export const countries = [
  { code: "RU", title: "Россия", currency: "RUB", locale: "ru-RU" },
  { code: "KZ", title: "Казахстан", currency: "KZT", locale: "ru-KZ" },
  { code: "BY", title: "Беларусь", currency: "BYN", locale: "ru-BY" },
  { code: "KG", title: "Кыргызстан", currency: "KGS", locale: "ru-KG" },
] as const satisfies readonly CountryConfig[];

export const DEFAULT_COUNTRY: Country = "RU";
