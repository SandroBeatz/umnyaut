import { hasConsent } from "./consent";
import type { EventMap, EventName } from "./events";
import { metrikaEnabled, metrikaGoal } from "./metrika";

/** Parameters every event carries; set by the page that knows them (the calculator shell). */
export interface AnalyticsContext {
  country?: string;
  category?: string;
  tool?: string;
  variation?: string;
}

let context: AnalyticsContext = {};

export function setAnalyticsContext(next: AnalyticsContext): void {
  context = next;
}

export function analyticsContext(): AnalyticsContext {
  return context;
}

/** What an event sends: its own parameters over the common ones (source is `web` until the Telegram app). */
export function eventParams<E extends EventName>(params: EventMap[E], ctx: AnalyticsContext = context) {
  const { tool: _tool, ...common } = ctx;
  return { source: "web", ...common, ...params };
}

export const EVENTS_PATH = "/api/e/";

/**
 * The own anonymous counter (tech spec §14): the event's name, tool, country and source, nothing else — no cookies,
 * no ids. Counts without consent. Sent as text, so the beacon needs no preflight; the server reads it as JSON.
 */
function count<E extends EventName>(event: E, params: EventMap[E]): void {
  const { tool, country, source } = eventParams(params) as { tool?: string; country?: string; source: string };
  const body = JSON.stringify({ event, tool, country, source });
  try {
    if (navigator.sendBeacon?.(EVENTS_PATH, body)) return;
    void fetch(EVENTS_PATH, { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // A counter must never break the page.
  }
}

/**
 * Sends an event: always to the own anonymous counter (`/api/e/` → `events_daily`); to Metrika only after «Принять»
 * on the production host.
 */
export function track<E extends EventName>(event: E, params: EventMap[E]): void {
  if (typeof window === "undefined") return;
  count(event, params);
  if (hasConsent() && metrikaEnabled()) metrikaGoal(event, eventParams(params));
}
