"use client";

import type { ComponentProps, ReactNode } from "react";
import { Drawer } from "vaul";
import { cn } from "../lib/cn";

export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetClose = Drawer.Close;

export interface SheetContentProps extends Omit<ComponentProps<typeof Drawer.Content>, "title"> {
  title: ReactNode;
  description?: ReactNode;
}

/** Bottom sheet for the phone: drag handle, swipe down or Esc to close, focus trapped. */
export function SheetContent({ title, description, className, children, ...props }: SheetContentProps) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-text/40" />
      <Drawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-[var(--z-overlay)] flex max-h-[90dvh] flex-col rounded-t-xl bg-surface pb-[env(safe-area-inset-bottom)] outline-none",
          className,
        )}
        {...props}
      >
        <div aria-hidden="true" className="mx-auto mt-2 mb-3 h-1 w-10 shrink-0 rounded-full bg-border" />
        <div className="px-4 pb-2">
          <Drawer.Title className="text-h3 text-text">{title}</Drawer.Title>
          {description ? (
            <Drawer.Description className="mt-1 text-small text-text-muted">{description}</Drawer.Description>
          ) : null}
        </div>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}
