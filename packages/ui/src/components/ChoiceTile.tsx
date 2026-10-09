"use client";

import { Check } from "lucide-react";
import { RadioGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ChoiceTileOption<V extends string> {
  value: V;
  title: ReactNode;
  description?: ReactNode;
  /** Icon or small scheme shown above the title. */
  media?: ReactNode;
}

export interface ChoiceTileGroupProps<V extends string> {
  options: readonly ChoiceTileOption<V>[];
  value: V;
  onValueChange: (value: V) => void;
  label: string;
  columns?: 2 | 3;
  className?: string;
}

/** Visual single choice (room shape, laying pattern). Selection = teal border + check, never colour alone. */
export function ChoiceTileGroup<V extends string>({
  options,
  value,
  onValueChange,
  label,
  columns = 2,
  className,
}: ChoiceTileGroupProps<V>) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(next) => onValueChange(next as V)}
      aria-label={label}
      className={cn("grid gap-3", columns === 3 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2", className)}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className="group relative flex min-h-12 flex-col items-start gap-2 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-border-input data-[state=checked]:border-2 data-[state=checked]:border-primary data-[state=checked]:bg-surface-mint data-[state=checked]:p-[11px]"
        >
          {option.media ? <span className="text-primary-hover">{option.media}</span> : null}
          <span className="pr-6 text-body-strong text-text">{option.title}</span>
          {option.description ? <span className="text-small text-text-muted">{option.description}</span> : null}
          <RadioGroup.Indicator className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-on-primary">
            <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
          </RadioGroup.Indicator>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
