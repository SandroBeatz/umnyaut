"use client";

import type { ReactNode } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { Dialog, DialogContent, DialogTrigger } from "./Dialog";
import { Sheet, SheetContent, SheetTrigger } from "./Sheet";

export interface ResponsiveSheetProps {
  /** One element; rendered `asChild` as the opener. */
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** «Закрыть» from catalog (dialog close button). */
  closeLabel: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Design spec §11: a bottom sheet on the phone, a centred 480 px dialog from 1024 px. Same content in both.
 * The server and the first client render use the sheet (useMediaQuery is `false` until mount).
 */
export function ResponsiveSheet({
  trigger,
  title,
  description,
  closeLabel,
  open,
  onOpenChange,
  children,
}: ResponsiveSheetProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent title={title} description={description} closeLabel={closeLabel} className="max-w-[480px]">
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent title={title} description={description}>
        {children}
      </SheetContent>
    </Sheet>
  );
}
