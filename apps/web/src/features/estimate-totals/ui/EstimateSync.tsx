"use client";

import type { ToolId, ToolModule } from "@umnyaut/calc";
import { tools } from "@umnyaut/catalog";
import { useEffect, useState } from "react";
import { useEstimateStore } from "@/entities/estimate";
import { loadToolModule, type ToolValues } from "@/entities/tool";
import { computeEstimate, type SharedItemView, sharedOf, totalsOf } from "../model/compute";

export interface EstimateSyncProps {
  /** The calculator's open calc: its share of the shared consumables is reported. */
  calcId: string | undefined;
  onShared(shared: Readonly<Record<string, SharedItemView>> | undefined): void;
}

const known = new Set<string>(tools.map((t) => t.id));

/**
 * Keeps the estimate counted while a calculator is open (spec Р3, P17.10): loads the calculators of the estimate's
 * calcs, saves the totals for the header and reports the open calc's shared consumables. Renders nothing; loaded
 * after mount, so its code stays out of the page's first JS.
 */
export default function EstimateSync({ calcId, onShared }: EstimateSyncProps) {
  const estimate = useEstimateStore((s) => s.estimate);
  const [modules, setModules] = useState<ReadonlyMap<string, ToolModule<ToolValues>>>(() => new Map());

  useEffect(() => {
    const missing = [...new Set(estimate?.calcs.map((c) => c.tool) ?? [])].filter(
      (id) => known.has(id) && !modules.has(id),
    );
    if (missing.length === 0) return;
    let live = true;
    void Promise.all(missing.map(async (id) => [id, await loadToolModule(id as ToolId)] as const)).then((loaded) => {
      if (live) setModules((now) => new Map([...now, ...loaded]));
    });
    return () => {
      live = false;
    };
  }, [estimate, modules]);

  useEffect(() => {
    if (!estimate || estimate.calcs.some((c) => known.has(c.tool) && !modules.has(c.tool))) return;
    const moduleOf = (id: ToolId) => modules.get(id);
    const totals = totalsOf(computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined));
    const { at: _, ...stored } = estimate.totals ?? { at: 0 };
    if (JSON.stringify(stored) !== JSON.stringify(totals)) useEstimateStore.getState().setTotals(totals);
    if (!calcId) {
      onShared(undefined);
      return;
    }
    // The open calc counts here even below the threshold: it shows what it would buy with the estimate.
    const view = computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined || c.id === calcId);
    onShared(sharedOf(view, estimate, calcId));
  }, [estimate, modules, calcId, onShared]);

  return null;
}
