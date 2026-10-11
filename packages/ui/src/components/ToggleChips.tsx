"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ToggleChip<V extends string> {
  value: V;
  label: ReactNode;
}

export interface ToggleChipsProps<V extends string> {
  chips: readonly ToggleChip<V>[];
  value: readonly V[];
  onValueChange: (value: V[]) => void;
  /** Group name for screen readers («Что считаем»). */
  label: string;
  className?: string;
}

/** Several choices at once («Пол», «Стены»): same look as `PresetChips`, wraps instead of scrolling. */
export function ToggleChips<V extends string>({ chips, value, onValueChange, label, className }: ToggleChipsProps<V>) {
  const toggle = (chip: V) => onValueChange(value.includes(chip) ? value.filter((v) => v !== chip) : [...value, chip]);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset needs a visible legend; the label is above the chips
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => {
        const on = value.includes(chip.value);
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={on}
            data-state={on ? "on" : "off"}
            onClick={() => toggle(chip.value)}
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:border-border-input data-[state=on]:border-primary-soft data-[state=on]:bg-primary-soft data-[state=on]:text-primary-hover [&[data-state=off]_svg]:hidden"
          >
            <Check aria-hidden="true" className="size-4" strokeWidth={3} />
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
