"use client";

import { X } from "lucide-react";
import { Dialog as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export interface DialogContentProps extends Omit<ComponentProps<typeof Primitive.Content>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** «Закрыть» from catalog. */
  closeLabel: string;
}

/** Centered dialog (≥ 1024 or short confirmations). Focus is trapped, Esc closes. */
export function DialogContent({ title, description, closeLabel, className, children, ...props }: DialogContentProps) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-text/40 data-[state=open]:animate-[fade-in_320ms_var(--ease-standard)]" />
      <Primitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--z-overlay)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-6 shadow-lg data-[state=open]:animate-[fade-in_320ms_var(--ease-standard)]",
          className,
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Primitive.Title className="text-h3 text-text">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="mt-1 text-small text-text-muted">{description}</Primitive.Description>
            ) : null}
          </div>
          <Primitive.Close
            aria-label={closeLabel}
            className="-mt-3 -mr-3 flex size-12 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-sunken"
          >
            <X aria-hidden="true" className="size-5" />
          </Primitive.Close>
        </div>
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
