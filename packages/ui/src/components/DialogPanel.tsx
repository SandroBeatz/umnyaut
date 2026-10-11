"use client";

import type { ReactNode, RefObject } from "react";
import { Dialog, DialogContent } from "./Dialog";

export interface DialogPanelProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  className?: string;
  returnFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/** The loaded part of `LazyDialog`. */
export default function DialogPanel({ open, onOpenChange, returnFocus, children, ...content }: DialogPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...content}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus?.current?.focus();
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
