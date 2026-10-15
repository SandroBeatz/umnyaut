"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ESTIMATE_EVENT, ESTIMATE_KEY } from "@/shared/config";
import { readStorage } from "@/shared/lib";
import { ESTIMATE_PATH, EstimateLink } from "./EstimateLink";

let raw: string | null = null;
let count = 0;

/**
 * Calcs added to the estimate (Р4: `addedAt` set; drafts not counted), read straight from storage: the header needs
 * one number, not the estimate store and its schema on every page.
 */
function readCount(): number {
  const now = readStorage(ESTIMATE_KEY);
  if (now === raw) return count;
  raw = now;
  try {
    const calcs = (JSON.parse(now ?? "null") as { state?: { estimate?: { calcs?: unknown } } } | null)?.state?.estimate
      ?.calcs;
    count = Array.isArray(calcs)
      ? calcs.filter((c) => typeof (c as { addedAt?: unknown } | null)?.addedAt === "number").length
      : 0;
  } catch {
    count = 0;
  }
  return count;
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
 * «Список <count>» (spec «Шапка и футер»): the server and the first render show no count; the number of calcs in
 * the list appears after mount.
 */
export function EstimateButton() {
  const total = useSyncExternalStore(subscribe, readCount, () => 0);
  const here = usePathname() === ESTIMATE_PATH;
  return <EstimateLink here={here} {...(total > 0 ? { count: total } : {})} />;
}
