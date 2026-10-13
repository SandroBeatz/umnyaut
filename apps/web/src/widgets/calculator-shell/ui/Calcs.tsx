"use client";

/* Loaded after mount only: calcs exist in the browser, never in the server HTML (JS budget of a tool page). */

import { ESTIMATE_LIMITS, type EstimateCalc, type Surface } from "@umnyaut/calc";
import { shell, type ToolDef, tools } from "@umnyaut/catalog";
import { Button } from "@umnyaut/ui";
import { Plus, X } from "lucide-react";
import { fill } from "@/shared/lib";
import { Hint } from "@/shared/ui";
import { chipLabel, nextSurface, overlapOf, partsLabel } from "../model/calcs";

const t = shell.calcs;

export interface CalcChipsProps {
  tool: ToolDef;
  /** This tool's calcs in the active room. */
  calcs: readonly EstimateCalc[];
  currentId: string | undefined;
  onOpen(id: string): void;
  onAdd(): void;
  onRemove(id: string): void;
}

/**
 * «Плитка: [Стены · белая ×] [Пол · графит ×] [+ Ещё]» under the room row (spec «Несколько расчётов»): the calcs of
 * this tool in the room, the open one marked, «+ Ещё» while a surface is free; one line that scrolls sideways on the
 * phone.
 */
export function CalcChips({ tool, calcs, currentId, onOpen, onAdd, onRemove }: CalcChipsProps) {
  if (calcs.length === 0) return null;
  const canAdd = nextSurface(tool, calcs) !== undefined;
  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" data-calc-chips>
      <span className="shrink-0 text-small text-text-muted">{fill(t.title, { tool: tool.title })}</span>
      {calcs.map((calc, index) => {
        const name = chipLabel(tool, calc, index);
        const active = calc.id === currentId;
        return (
          <div
            key={calc.id}
            className={
              active
                ? "flex shrink-0 items-center rounded-full bg-primary-soft text-primary-hover"
                : "flex shrink-0 items-center rounded-full border border-border bg-surface text-text"
            }
          >
            <button
              type="button"
              aria-pressed={active}
              aria-label={fill(t.open, { calc: name })}
              onClick={() => onOpen(calc.id)}
              className="min-h-12 whitespace-nowrap pl-4 text-small font-semibold"
            >
              {name}
            </button>
            <button
              type="button"
              aria-label={fill(t.remove, { calc: name })}
              onClick={() => onRemove(calc.id)}
              className="flex size-12 items-center justify-center rounded-full text-text-muted hover:text-danger"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        );
      })}
      {canAdd ? (
        <button
          type="button"
          aria-label={fill(t.moreLabel, { tool: tool.title })}
          disabled={calcs.length >= ESTIMATE_LIMITS.calcs}
          onClick={onAdd}
          className="flex min-h-12 shrink-0 items-center gap-1 rounded-full border border-dashed border-primary px-4 text-small font-semibold text-primary hover:bg-primary-soft"
        >
          <Plus aria-hidden="true" className="size-4" />
          {t.more}
        </button>
      ) : null}
    </div>
  );
}

export interface CalcOverlapHintProps {
  current: EstimateCalc | undefined;
  /** Every calc of the active room. */
  calcs: readonly EstimateCalc[];
  onSplit(id: string, surfaces: readonly [Surface, Surface]): void;
}

/** «Пол уже в расчёте «Плитка: Пол и стены». Разделить на два расчёта?» — under the result, never above it. */
export function CalcOverlapHint({ current, calcs, onSplit }: CalcOverlapHintProps) {
  const overlap = overlapOf(current, calcs, tools);
  if (!overlap) return null;
  const { split } = overlap;
  return (
    <Hint>
      <p>
        {fill(t.overlap, { parts: partsLabel(overlap.parts), calc: overlap.calc })}
        {split ? ` ${t.split}` : null}
      </p>
      {split ? (
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => onSplit(split.id, split.surfaces)}>
          {t.splitButton}
        </Button>
      ) : null}
    </Hint>
  );
}
