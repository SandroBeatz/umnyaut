/**
 * Waste (запас) rules. Default % depends on the laying method and the room shape; the user may override it.
 * The numbers themselves are norm data in `catalog` with a source — this block only applies them.
 */
export interface WasteRule {
  /** Laying method id, e.g. 'straight' | 'diagonal' | 'herringbone'. */
  method: string;
  /** Waste for a rectangular room, %. */
  pct: number;
  /** Extra % for an L-shaped or free-contour room (more cuts at the inner corner). */
  complexShapePct?: number;
}

/** Waste % for the method and shape; an explicit user override wins. Unknown method → 0 (the tool warns). */
export function wastePct(
  rules: readonly WasteRule[],
  method: string,
  shape: "rect" | "l" | "polygon",
  override?: number,
): number {
  if (override !== undefined && override >= 0) return override;
  const rule = rules.find((r) => r.method === method);
  if (!rule) return 0;
  return rule.pct + (shape === "rect" ? 0 : (rule.complexShapePct ?? 0));
}

/** amount × (1 + pct / 100). */
export const withWaste = (amount: number, pct: number) => amount * (1 + Math.max(pct, 0) / 100);
