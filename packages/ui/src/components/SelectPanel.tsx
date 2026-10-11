"use client";

import { Check } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { cn } from "../lib/cn";
import PopoverPanel from "./PopoverPanel";
import { Sheet, SheetContent } from "./Sheet";

export interface SelectPanelOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectPanelProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: ReactNode;
  labelId: string;
  options: readonly SelectPanelOption[];
  value: string;
  onPick(value: string): void;
  anchor: RefObject<HTMLButtonElement | null>;
}

/** The loaded part of `Select`: a bottom sheet on the phone, a panel under the field from 1024 px. */
export default function SelectPanel({
  open,
  onOpenChange,
  title,
  labelId,
  options,
  value,
  onPick,
  anchor,
}: SelectPanelProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const pick = (next: string) => {
    onPick(next);
    onOpenChange(false);
  };
  const list = (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: a styled radio row
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => pick(option.value)}
            className="flex min-h-12 items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-sunken focus-visible:bg-surface-sunken"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                checked ? "border-primary bg-primary text-on-primary" : "border-border-input",
              )}
            >
              {checked ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
            <span className="flex flex-col">
              <span className={cn("text-body text-text", checked && "font-semibold")}>{option.label}</span>
              {option.description ? <span className="text-small text-text-muted">{option.description}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (desktop) {
    return (
      <PopoverPanel
        open={open}
        onOpenChange={onOpenChange}
        anchor={anchor}
        className="max-h-80 w-[var(--radix-popover-trigger-width)] min-w-0 overflow-y-auto p-1"
      >
        {list}
      </PopoverPanel>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={title}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          anchor.current?.focus();
        }}
      >
        {list}
      </SheetContent>
    </Sheet>
  );
}
