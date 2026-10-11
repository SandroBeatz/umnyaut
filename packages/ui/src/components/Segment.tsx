"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { onRovingKeyDown, rovingTabIndex } from "../lib/roving";

export interface SegmentOption<V extends string> {
  value: V;
  label: ReactNode;
}

export interface SegmentProps<V extends string> {
  options: readonly SegmentOption<V>[];
  value: V;
  onValueChange: (value: V) => void;
  /** Accessible name of the group, e.g. «Способ укладки». */
  label: string;
  size?: "md" | "sm";
  className?: string;
}

/** Single choice from 2–4 short options. Always has a value (clicking the active option keeps it). */
export function Segment<V extends string>({
  options,
  value,
  onValueChange,
  label,
  size = "md",
  className,
}: SegmentProps<V>) {
  const anyChecked = options.some((option) => option.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onRovingKeyDown}
      className={cn("inline-flex rounded-md bg-surface-sunken p-1", size === "md" ? "w-full" : "w-auto", className)}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: a segment that behaves as a radio
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            data-roving=""
            data-state={checked ? "on" : "off"}
            tabIndex={rovingTabIndex(checked, index, anyChecked)}
            onClick={() => !checked && onValueChange(option.value)}
            className={cn(
              "flex-1 rounded-sm px-3 font-semibold text-text-muted transition-colors hover:text-text data-[state=on]:bg-surface data-[state=on]:text-primary-hover data-[state=on]:shadow-sm",
              size === "md" ? "h-10 text-body-strong" : "h-10 min-w-12 text-small",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
