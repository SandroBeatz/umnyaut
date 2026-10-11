"use client";

import { ChevronDown } from "lucide-react";
import { lazy, type ReactNode, Suspense, useId, useRef, useState } from "react";
import { cn } from "../lib/cn";

const loadPanel = () => import("./SelectPanel");
const Panel = lazy(loadPanel);

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  description?: string;
}

export interface SelectProps<V extends string> {
  label: ReactNode;
  options: readonly SelectOption<V>[];
  value: V;
  onValueChange: (value: V) => void;
  className?: string;
}

/**
 * Bottom sheet of options on the phone, a panel under the field from 1024 px; one trigger look. Only the trigger
 * is in the page bundle — the list loads on hover, focus or the first tap (plan P9.11).
 */
export function Select<V extends string>({ label, options, value, onValueChange, className }: SelectProps<V>) {
  const labelId = useId();
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  if (open && !used) setUsed(true);
  const current = options.find((option) => option.value === value);
  const preload = () => void loadPanel();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={labelId} className="text-small font-medium text-text">
        {label}
      </span>
      <button
        ref={opener}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-value`}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-md border border-border-input bg-surface px-3 text-left text-input text-text transition-colors hover:border-text-muted"
        onClick={() => setOpen((value) => !value)}
        onPointerEnter={preload}
        onFocus={preload}
      >
        <span id={`${labelId}-value`} className="min-w-0 truncate">
          {current?.label}
        </span>
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-text-muted" />
      </button>
      {used ? (
        <Suspense fallback={null}>
          <Panel
            open={open}
            onOpenChange={setOpen}
            title={label}
            labelId={labelId}
            options={options}
            value={value}
            onPick={(next) => onValueChange(next as V)}
            anchor={opener}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
