"use client";

import type { Country } from "@umnyaut/calc";
import type { ToolDef } from "@umnyaut/catalog";
import { useEffect, useRef } from "react";
import { countryNow } from "@/entities/country";
import type { ToolValues } from "@/entities/tool";
import { setAnalyticsContext, track } from "@/shared/analytics";

/** «Result seen» = visible for this long after the last change (business spec §11). */
export const COMPLETED_AFTER_MS = 5000;
const MIN_FIELDS = 2;
/** Below this width the sticky bar shows the result while the panel is off-screen. */
const PHONE_QUERY = "(max-width: 1023px)";

export interface CalcEventsInput {
  tool: ToolDef;
  country: Country;
  values: ToolValues;
  edits: number;
  fieldsChanged: number;
  /** `ResultPanel` is on screen. */
  panelVisible: boolean;
}

const filled = (value: unknown) => typeof value === "number" && value > 0;

/**
 * The calculator's analytics: `tool_view`, `calc_started` (first change), `calc_completed` (≥ 2 fields and the
 * result seen for 5 s, in the panel or the sticky bar), one `calc_adjusted` after it, `price_added`.
 */
export function useCalcEvents({ tool, country, values, edits, fieldsChanged, panelVisible }: CalcEventsInput) {
  const completed = useRef(false);
  const adjusted = useRef(false);
  const prices = useRef<ToolValues | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `country` changing (footer switch) resets the context
  useEffect(() => {
    // Not `country`: on the first render it is still the default RU, and `tool_view` below goes out in this commit.
    setAnalyticsContext({ country: countryNow(), category: tool.category, tool: tool.id });
    return () => setAnalyticsContext({});
  }, [country, tool]);

  useEffect(() => {
    track("tool_view", { tool: tool.id });
  }, [tool]);

  useEffect(() => {
    if (edits === 1) track("calc_started", { tool: tool.id });
    if (edits > 0 && completed.current && !adjusted.current) {
      adjusted.current = true;
      track("calc_adjusted", { tool: tool.id });
    }
  }, [edits, tool]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: every change (`edits`) restarts the 5 s
  useEffect(() => {
    if (completed.current || fieldsChanged < MIN_FIELDS) return;
    const via = panelVisible ? "panel" : window.matchMedia(PHONE_QUERY).matches ? "sticky" : undefined;
    if (!via) return;
    const timer = window.setTimeout(() => {
      completed.current = true;
      track("calc_completed", { tool: tool.id, fieldsChanged, via });
    }, COMPLETED_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [edits, fieldsChanged, panelVisible, tool]);

  useEffect(() => {
    const before = prices.current;
    prices.current = values;
    if (!before || edits === 0) return;
    for (const field of tool.fields) {
      if (field.kind === "price" && filled(values[field.name]) && !filled(before[field.name])) {
        track("price_added", { tool: tool.id, item: field.item });
      }
    }
  }, [values, edits, tool]);
}
