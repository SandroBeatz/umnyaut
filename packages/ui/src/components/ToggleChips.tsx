"use client";

import { Check } from "lucide-react";
import { ToggleGroup } from "radix-ui";
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
  return (
    <ToggleGroup.Root
      type="multiple"
      value={[...value]}
      onValueChange={(next) => onValueChange(next as V[])}
      aria-label={label}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {chips.map((chip) => (
        <ToggleGroup.Item
          key={chip.value}
          value={chip.value}
          className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:border-border-input data-[state=on]:border-primary-soft data-[state=on]:bg-primary-soft data-[state=on]:text-primary-hover [&[data-state=off]_svg]:hidden"
        >
          <Check aria-hidden="true" className="size-4" strokeWidth={3} />
          {chip.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
