"use client";

import { Popover as Primitive } from "radix-ui";
import type { ReactNode, RefObject } from "react";
import { cn } from "../lib/cn";

export interface PopoverPanelProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  anchor: RefObject<HTMLElement | null>;
  align?: "start" | "center" | "end";
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}

/** The loaded part of `PopoverMenu`: Radix popover placed at the opener, which stays outside its root. */
export default function PopoverPanel({
  open,
  onOpenChange,
  anchor,
  align = "start",
  className,
  children,
  ...aria
}: PopoverPanelProps) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Anchor virtualRef={anchor as RefObject<HTMLElement>} />
      <Primitive.Portal>
        <Primitive.Content
          align={align}
          sideOffset={8}
          // A click on the opener toggles it itself; without this it would close here and reopen there.
          onInteractOutside={(event) => {
            if (anchor.current?.contains(event.target as Node)) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            anchor.current?.focus();
          }}
          className={cn(
            "z-[var(--z-overlay)] min-w-56 rounded-lg border border-border bg-surface p-2 shadow-lg outline-none motion-safe:animate-[fade-in_120ms_var(--ease-standard)]",
            className,
          )}
          onClickCapture={(event) => {
            if ((event.target as Element).closest("a[href]")) onOpenChange(false);
          }}
          {...aria}
        >
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
