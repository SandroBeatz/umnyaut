"use client";

import { Slot } from "radix-ui";
import { lazy, type ReactNode, type RefObject, Suspense, useRef, useState } from "react";

const loadPanel = () => import("./ResponsiveSheetPanel");
const Panel = lazy(loadPanel);

export interface ResponsiveSheetProps {
  /** One element; rendered `asChild` as the opener. None: the sheet is opened by `open` alone. */
  trigger?: ReactNode;
  /** Without a trigger: what gets the focus back on close. */
  returnFocus?: RefObject<HTMLElement | null>;
  /** Runs once the sheet has closed; `true` keeps the focus where the callback put it. */
  onClosed?: () => boolean | undefined;
  title: ReactNode;
  description?: ReactNode;
  /** «Закрыть» from catalog (dialog close button). */
  closeLabel: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 880 px dialog from 1024 px instead of 480 px: for content laid out in two columns there. */
  wide?: boolean;
  children: ReactNode;
}

/**
 * Design spec §11: a bottom sheet on the phone, a centred 480 px dialog from 1024 px. Same content in both.
 * Only the opener is in the page bundle; the sheet (vaul, Radix dialog) loads on hover, focus or the first
 * open (plan P9.11) and stays mounted afterwards so closing animates.
 */
export function ResponsiveSheet({ trigger, open, onOpenChange, returnFocus, ...panel }: ResponsiveSheetProps) {
  const opener = useRef<HTMLElement>(null);
  const [own, setOwn] = useState(false);
  const isOpen = open ?? own;
  const [used, setUsed] = useState(isOpen);
  if (isOpen && !used) setUsed(true);

  const change = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  const preload = () => void loadPanel();

  return (
    <>
      {trigger ? (
        <Slot.Root
          ref={opener}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => change(true)}
          onPointerEnter={preload}
          onFocus={preload}
        >
          {trigger}
        </Slot.Root>
      ) : null}
      {used ? (
        <Suspense fallback={null}>
          <Panel
            open={isOpen}
            onOpenChange={change}
            returnFocus={trigger ? opener : (returnFocus ?? opener)}
            {...panel}
          />
        </Suspense>
      ) : null}
    </>
  );
}
