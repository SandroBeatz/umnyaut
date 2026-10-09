"use client";

import { Minus, Plus } from "lucide-react";
import { type ReactNode, useId } from "react";
import { cn } from "../lib/cn";

export interface StepperProps {
  label: ReactNode;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Button names from catalog: «Меньше», «Больше». */
  decrementLabel: string;
  incrementLabel: string;
  className?: string;
}

/** Small whole counts (doors, windows, layers): − value +, 48 px buttons. */
export function Stepper({
  label,
  value,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  decrementLabel,
  incrementLabel,
  className,
}: StepperProps) {
  const id = useId();
  const set = (next: number) => onValueChange(Math.min(max, Math.max(min, next)));
  const button =
    "flex size-12 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary-soft disabled:pointer-events-none disabled:text-text-subtle [&_svg]:size-5";
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span id={id} className="text-body text-text">
        {label}
      </span>
      <fieldset
        aria-labelledby={id}
        className="m-0 flex min-w-0 items-center rounded-md border border-border-input p-0"
      >
        <button
          type="button"
          className={button}
          aria-label={decrementLabel}
          disabled={value <= min}
          onClick={() => set(value - step)}
        >
          <Minus aria-hidden="true" />
        </button>
        <output aria-live="polite" className="min-w-8 text-center text-input tabular-nums">
          {value}
        </output>
        <button
          type="button"
          className={button}
          aria-label={incrementLabel}
          disabled={value >= max}
          onClick={() => set(value + step)}
        >
          <Plus aria-hidden="true" />
        </button>
      </fieldset>
    </div>
  );
}
