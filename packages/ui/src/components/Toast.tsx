"use client";

import { useSyncExternalStore } from "react";
import { cn } from "../lib/cn";

/** How long a confirmation stays (design spec §11: short confirmations only). */
const DURATION_MS = 3000;
const MAX_VISIBLE = 3;

interface ToastItem {
  id: number;
  text: string;
  tone: "default" | "error";
}

let items: readonly ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

function show(text: string, tone: ToastItem["tone"]) {
  const id = nextId++;
  items = [...items, { id, text, tone }].slice(-MAX_VISIBLE);
  emit();
  setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, DURATION_MS);
}

/** «Ссылка скопирована»: `toast(text)`, `toast.error(text)`. Works once `Toaster` is mounted. */
export const toast = Object.assign((text: string) => show(text, "default"), {
  error: (text: string) => show(text, "error"),
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => items;
const empty: readonly ToastItem[] = [];

/**
 * Mount once in the root layout. Own ~1 KB store instead of a toast library (plan P9.11): the live region is
 * always in the page, so screen readers announce every message.
 */
export function Toaster() {
  const list = useSyncExternalStore(subscribe, snapshot, () => empty);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-[var(--z-toast)] flex flex-col items-center gap-2 px-4 print:hidden"
    >
      {list.map((item) => (
        <p
          key={item.id}
          className={cn(
            "flex w-full max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-body-strong shadow-lg transition-[opacity,translate] duration-200 ease-standard starting:translate-y-2 starting:opacity-0",
            item.tone === "error" ? "bg-danger text-white" : "bg-text text-bg",
          )}
        >
          {item.text}
        </p>
      ))}
    </div>
  );
}
