"use client";

import type { ReactNode, RefObject } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { Dialog, DialogContent } from "./Dialog";
import { Sheet, SheetContent } from "./Sheet";

export interface ResponsiveSheetPanelProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  /** Gets the focus back on close: the opener lives outside the dialog root. */
  returnFocus: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/** The loaded part of `ResponsiveSheet`: vaul bottom sheet on the phone, Radix dialog from 1024 px. */
export default function ResponsiveSheetPanel({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  returnFocus,
  children,
}: ResponsiveSheetPanelProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const onCloseAutoFocus = (event: Event) => {
    event.preventDefault();
    returnFocus.current?.focus();
  };
  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          title={title}
          description={description}
          closeLabel={closeLabel}
          className="max-w-[480px]"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={title} description={description} onCloseAutoFocus={onCloseAutoFocus}>
        {children}
      </SheetContent>
    </Sheet>
  );
}
