"use client";

import { useEffect } from "react";
import { useEstimateStore } from "@/entities/estimate";
import { computeEstimate, type SharedItemView, sharedOf } from "../model/compute";
import { saveTotals } from "../model/save";
import { useToolModules } from "../model/useToolModules";

export interface EstimateSyncProps {
  /** The calculator's open calc: its share of the shared consumables is reported. */
  calcId: string | undefined;
  onShared(shared: Readonly<Record<string, SharedItemView>> | undefined): void;
}

/**
 * Keeps the estimate counted while a calculator is open (spec Р3, P17.10): loads the calculators of the estimate's
 * calcs, saves the totals for the header and reports the open calc's shared consumables. Renders nothing; loaded
 * after mount, so its code stays out of the page's first JS.
 */
export default function EstimateSync({ calcId, onShared }: EstimateSyncProps) {
  const estimate = useEstimateStore((s) => s.estimate);
  const moduleOf = useToolModules(estimate?.calcs.map((c) => c.tool) ?? []);

  useEffect(() => {
    if (!estimate || !moduleOf) return;
    saveTotals(computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined));
    if (!calcId) {
      onShared(undefined);
      return;
    }
    // The open calc counts here even below the threshold: it shows what it would buy with the estimate.
    const view = computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined || c.id === calcId);
    onShared(sharedOf(view, estimate, calcId));
  }, [estimate, moduleOf, calcId, onShared]);

  return null;
}
