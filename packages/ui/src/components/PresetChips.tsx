"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { onRovingKeyDown, rovingTabIndex } from "../lib/roving";

export interface PresetChip<V extends string> {
  value: V;
  label: ReactNode;
}

export interface PresetChipsProps<V extends string> {
  chips: readonly PresetChip<V>[];
  /** `null` when the current input matches no preset. */
  value: V | null;
  onValueChange: (value: V) => void;
  label: string;
  className?: string;
}

/** Typical values in one tap («Кухня 9 м²», «Комната 18 м²»). Horizontal scroll on phone, wraps from 640 px. */
export function PresetChips<V extends string>({ chips, value, onValueChange, label, className }: PresetChipsProps<V>) {
  const anyChecked = chips.some((chip) => chip.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onRovingKeyDown}
      className={cn(
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        className,
      )}
    >
      {chips.map((chip, index) => {
        const checked = chip.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: a chip that behaves as a radio
          <button
            key={chip.value}
            type="button"
            role="radio"
            aria-checked={checked}
            data-roving=""
            data-state={checked ? "on" : "off"}
            tabIndex={rovingTabIndex(checked, index, anyChecked)}
            onClick={() => !checked && onValueChange(chip.value)}
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
