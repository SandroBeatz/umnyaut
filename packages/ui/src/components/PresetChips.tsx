"use client";

import { Check } from "lucide-react";
import { ToggleGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

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
  return (
    <ToggleGroup.Root
      type="single"
      value={value ?? ""}
      onValueChange={(next) => next && onValueChange(next as V)}
      aria-label={label}
      className={cn(
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        className,
      )}
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
