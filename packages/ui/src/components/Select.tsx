"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as Primitive } from "radix-ui";
import { type ReactNode, useId, useState } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { cn } from "../lib/cn";
import { Sheet, SheetContent } from "./Sheet";

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

const trigger =
  "flex h-12 w-full items-center justify-between gap-2 rounded-md border border-border-input bg-surface px-3 text-left text-input text-text transition-colors hover:border-text-muted";

/** Bottom sheet on phone, dropdown from 1024 px. Both share one trigger look. */
export function Select<V extends string>({ label, options, value, onValueChange, className }: SelectProps<V>) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={labelId} className="text-small font-medium text-text">
        {label}
      </span>
      {desktop ? (
        <Primitive.Root value={value} onValueChange={(next) => onValueChange(next as V)}>
          <Primitive.Trigger aria-labelledby={labelId} className={trigger}>
            <Primitive.Value />
            <Primitive.Icon>
              <ChevronDown aria-hidden="true" className="size-5 text-text-muted" />
            </Primitive.Icon>
          </Primitive.Trigger>
          <Primitive.Portal>
            <Primitive.Content
              position="popper"
              sideOffset={4}
              className="z-[var(--z-overlay)] max-h-80 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-surface shadow-md"
            >
              <Primitive.Viewport className="p-1">
                {options.map((option) => (
                  <Primitive.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex min-h-12 cursor-pointer select-none flex-col justify-center rounded-sm py-2 pr-3 pl-9 text-body text-text outline-none data-[highlighted]:bg-surface-sunken data-[state=checked]:font-semibold"
                  >
                    <Primitive.ItemIndicator className="absolute left-2.5 text-primary">
                      <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                    </Primitive.ItemIndicator>
                    <Primitive.ItemText>{option.label}</Primitive.ItemText>
                    {option.description ? (
                      <span className="text-small text-text-muted">{option.description}</span>
                    ) : null}
                  </Primitive.Item>
                ))}
              </Primitive.Viewport>
            </Primitive.Content>
          </Primitive.Portal>
        </Primitive.Root>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-labelledby={labelId}
            aria-describedby={`${labelId}-value`}
            className={trigger}
            onClick={() => setOpen(true)}
          >
            <span id={`${labelId}-value`}>{current?.label}</span>
            <ChevronDown aria-hidden="true" className="size-5 text-text-muted" />
          </button>
          <SheetContent title={label}>
            <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col">
              {options.map((option) => {
                const checked = option.value === value;
                return (
                  // biome-ignore lint/a11y/useSemanticElements: a styled radio row inside the sheet
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    className="flex min-h-14 items-center gap-3 rounded-md px-2 text-left hover:bg-surface-sunken"
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
                      {option.description ? (
                        <span className="text-small text-text-muted">{option.description}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
