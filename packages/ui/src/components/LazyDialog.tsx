"use client";

import { lazy, Suspense, useState } from "react";
import type { DialogPanelProps } from "./DialogPanel";

const loadPanel = () => import("./DialogPanel");
const Panel = lazy(loadPanel);

/** Preload on hover or focus of whatever opens the dialog. */
export const preloadDialog = () => void loadPanel();

export type LazyDialogProps = DialogPanelProps;

/**
 * A controlled centred dialog whose code (Radix dialog) loads on the first open (plan P9.11). The openers live
 * in the page; pass the one that opened it as `returnFocus`.
 */
export function LazyDialog(props: LazyDialogProps) {
  const [used, setUsed] = useState(props.open);
  if (props.open && !used) setUsed(true);
  return used ? (
    <Suspense fallback={null}>
      <Panel {...props} />
    </Suspense>
  ) : null;
}
