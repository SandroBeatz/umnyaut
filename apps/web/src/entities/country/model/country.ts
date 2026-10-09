import type { Country } from "@umnyaut/calc";
import { countries, DEFAULT_COUNTRY } from "@umnyaut/catalog";
import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "@/shared/lib";

export const COUNTRY_KEY = "umnyaut:country";

const zones: Readonly<Record<string, Country>> = {
  "Europe/Minsk": "BY",
  "Asia/Bishkek": "KG",
  "Asia/Almaty": "KZ",
  "Asia/Qyzylorda": "KZ",
  "Asia/Qostanay": "KZ",
  "Asia/Aqtobe": "KZ",
  "Asia/Aqtau": "KZ",
  "Asia/Atyrau": "KZ",
  "Asia/Oral": "KZ",
};

/** Country by time zone (tech spec §10: detected in the browser, never by server headers). */
export function detectCountry(timeZone: string | undefined): Country {
  return (timeZone && zones[timeZone]) || DEFAULT_COUNTRY;
}

const isCountry = (value: string | null): value is Country => countries.some((c) => c.code === value);

let detected: Country | undefined;
const listeners = new Set<() => void>();

function current(): Country {
  const stored = readStorage(COUNTRY_KEY);
  if (isCountry(stored)) return stored;
  detected ??= detectCountry(Intl.DateTimeFormat().resolvedOptions().timeZone);
  return detected;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => event.key === COUNTRY_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The user's country; the server and the first client render use the default (static HTML is RU). */
export function useCountry(): Country {
  return useSyncExternalStore(subscribe, current, () => DEFAULT_COUNTRY);
}

export function setCountry(country: Country): void {
  writeStorage(COUNTRY_KEY, country);
  for (const listener of listeners) listener();
}
