"use client";

import { lazy, type ReactNode, Suspense, useRef, useState } from "react";

const loadPanel = () => import("./PopoverPanel");
const Panel = lazy(loadPanel);

export interface PopoverMenuProps {
  /** Content of the opener button. */
  label: ReactNode;
  /** Classes of the opener button. */
  className?: string;
  "aria-label"?: string;
  align?: "start" | "center" | "end";
  panelClassName?: string;
  panelLabel?: string;
  /** Panel content; a function gets `close()` for items that finish the choice. A followed link closes it too. */
  children: ReactNode | ((close: () => void) => ReactNode);
}

/**
 * A button with a floating panel under it: country choice, the desktop «Калькуляторы» menu. Only the button is
 * in the page bundle; the Radix popover loads on hover, focus or the first click (plan P9.11).
 */
export function PopoverMenu({
  label,
  className,
  align,
  panelClassName,
  panelLabel,
  children,
  ...aria
}: PopoverMenuProps) {
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  if (open && !used) setUsed(true);
  const preload = () => void loadPanel();

  return (
    <>
      <button
        ref={opener}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className}
        onClick={() => setOpen((value) => !value)}
        onPointerEnter={preload}
        onFocus={preload}
        {...aria}
      >
        {label}
      </button>
      {used ? (
        <Suspense fallback={null}>
          <Panel
            open={open}
            onOpenChange={setOpen}
            anchor={opener}
            align={align}
            className={panelClassName}
            aria-label={panelLabel}
          >
            {typeof children === "function" ? children(() => setOpen(false)) : children}
          </Panel>
        </Suspense>
      ) : null}
    </>
  );
}
