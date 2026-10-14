"use client";

import { formatMoney } from "@umnyaut/ui/format";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useCountry } from "@/entities/country";
import { ESTIMATE_EVENT, ESTIMATE_KEY } from "@/shared/config";
import { readStorage } from "@/shared/lib";
import { ESTIMATE_PATH, EstimateLink } from "./EstimateLink";

let raw: string | null = null;
let sum = 0;

/**
 * The saved total of the estimate (Р3), read straight from storage: the header needs one number, not the estimate
 * store and its schema on every page.
 */
function readSum(): number {
  const now = readStorage(ESTIMATE_KEY);
  if (now === raw) return sum;
  raw = now;
  try {
    const value = (JSON.parse(now ?? "null") as { state?: { estimate?: { totals?: { sum?: unknown } } } } | null)?.state
      ?.estimate?.totals?.sum;
    sum = typeof value === "number" && value > 0 ? value : 0;
  } catch {
    sum = 0;
  }
  return sum;
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => event.key === ESTIMATE_KEY && listener();
  window.addEventListener(ESTIMATE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ESTIMATE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * «Список покупок <sum>» (spec «Шапка и футер»): the server and the first render say «Список покупок»; the saved sum (Р3) fills the
 * reserved width after mount. Teal on the estimate page.
 */
export function EstimateButton() {
  const total = useSyncExternalStore(subscribe, readSum, () => 0);
  const country = useCountry();
  const here = usePathname() === ESTIMATE_PATH;
  return <EstimateLink here={here} {...(total > 0 ? { sum: formatMoney(total, country) } : {})} />;
}
