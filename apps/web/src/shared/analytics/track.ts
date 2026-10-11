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

/**
 * Sends an event. Metrika gets it only after «Принять» on the production host; the own anonymous counter
 * (`/api/e` → `events_daily`) joins with the database (P9.3) and will count without consent.
 */
export function track<E extends EventName>(event: E, params: EventMap[E]): void {
  if (typeof window === "undefined") return;
  if (hasConsent() && metrikaEnabled()) metrikaGoal(event, eventParams(params));
}
