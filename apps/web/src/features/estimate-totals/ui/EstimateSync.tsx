"use client";

import type { PurchaseItem } from "@umnyaut/calc";
import { useEffect } from "react";
import { useEstimateStore } from "@/entities/estimate";
import { computeEstimate, productsOf, type SharedItemView, sharedOf } from "../model/compute";
import { saveTotals } from "../model/save";
import { useToolModules } from "../model/useToolModules";

export interface EstimateSyncProps {
  /** The calculator's open calc: its share of the shared consumables is reported. */
  calcId: string | undefined;
  onShared(shared: Readonly<Record<string, SharedItemView>> | undefined): void;
  /** Shared consumables the list has from the other calcs, by item key (`productsOf`). */
  onProducts(products: Readonly<Record<string, readonly PurchaseItem[]>>): void;
}

/**
 * Keeps the estimate counted while a calculator is open (spec Р3, P17.10): loads the calculators of the estimate's
 * calcs, saves the totals for the header and reports the open calc's shared consumables. Renders nothing; loaded
 * after mount, so its code stays out of the page's first JS.
 */
export default function EstimateSync({ calcId, onShared, onProducts }: EstimateSyncProps) {
  const estimate = useEstimateStore((s) => s.estimate);
  const moduleOf = useToolModules(estimate?.calcs.map((c) => c.tool) ?? []);

  useEffect(() => {
    if (!estimate || !moduleOf) return;
    saveTotals(computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined));
    onProducts(productsOf(computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined && c.id !== calcId)));
    if (!calcId) {
      onShared(undefined);
      return;
    }
    // The open calc counts here as it is on screen — not yet added, or with unsaved edits: what it would buy with
    // the estimate.
    const shown = {
      ...estimate,
      calcs: estimate.calcs.map((c) => (c.id === calcId && c.draft ? { ...c, input: c.draft } : c)),
    };
    const view = computeEstimate(shown, moduleOf, (c) => c.addedAt !== undefined || c.id === calcId);
    onShared(sharedOf(view, shown, calcId));
  }, [estimate, moduleOf, calcId, onShared, onProducts]);

  return null;
}
