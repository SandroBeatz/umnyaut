"use client";

import { useSyncExternalStore } from "react";
import { readJson, writeStorage } from "@/shared/lib";
import { forgetMetrika } from "./metrika";

export const CONSENT_KEY = "umnyaut:consent:v1";
/** After «Отклонить» the banner stays hidden for six months (business spec §12). */
export const DECLINE_DAYS = 183;
const DAY_MS = 86_400_000;

export type ConsentChoice = "accepted" | "declined";
/** `unknown` = server and first client render; `ask` = show the banner. */
export type ConsentState = ConsentChoice | "ask" | "unknown";

interface Stored {
  choice: ConsentChoice;
  /** ISO date of the choice. */
  at: string;
}

/** The stored choice, or `ask` when there is none, it is broken or a refusal is older than six months. */
export function consentFrom(stored: Stored | undefined, now: number): ConsentChoice | "ask" {
  if (!stored || (stored.choice !== "accepted" && stored.choice !== "declined")) return "ask";
  const at = Date.parse(stored.at);
  if (Number.isNaN(at)) return "ask";
  if (stored.choice === "declined" && now - at > DECLINE_DAYS * DAY_MS) return "ask";
  return stored.choice;
}

const listeners = new Set<() => void>();
/** «Настройки cookie» reopens the banner for this page view without forgetting the choice. */
let reopened = false;
let snapshot: ConsentState | undefined;

function compute(): ConsentState {
  return reopened ? "ask" : consentFrom(readJson<Stored>(CONSENT_KEY), Date.now());
}

function current(): ConsentState {
  if (snapshot === undefined) snapshot = compute();
  return snapshot;
}

function notify() {
  snapshot = compute();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => event.key === CONSENT_KEY && notify();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The current choice; the server render and the first client render are `unknown` (no banner in static HTML). */
export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, current, () => "unknown");
}

/** Read outside React (track()): only `accepted` lets data go to Metrika. */
export function hasConsent(): boolean {
  return current() === "accepted";
}

export function setConsent(choice: ConsentChoice): void {
  writeStorage(CONSENT_KEY, JSON.stringify({ choice, at: new Date().toISOString() } satisfies Stored));
  reopened = false;
  notify();
  if (choice === "declined") forgetMetrika();
}

export function reopenConsent(): void {
  reopened = true;
  notify();
}
