import type { EstimateAggregate } from "@umnyaut/calc";
import { useEstimateStore } from "@/entities/estimate";
import { totalsOf } from "./compute";

/** Stores the totals for the header (Р3) when they changed, so a recount with the same result writes nothing. */
export function saveTotals(aggregate: EstimateAggregate): void {
  const { estimate, setTotals } = useEstimateStore.getState();
  if (!estimate) return;
  const totals = totalsOf(aggregate);
  const { at: _, ...stored } = estimate.totals ?? { at: 0 };
  if (JSON.stringify(stored) !== JSON.stringify(totals)) setTotals(totals);
}
