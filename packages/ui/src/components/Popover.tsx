"use client";

import { Popover as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;

/** Small floating panel under a trigger: country choice, the desktop «Калькуляторы» menu. */
export function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-overlay)] min-w-56 rounded-lg border border-border bg-surface p-2 shadow-lg outline-none motion-safe:animate-[fade-in_120ms_var(--ease-standard)]",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
