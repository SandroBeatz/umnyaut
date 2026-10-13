"use client";

import { useSyncExternalStore } from "react";
import { cn } from "../lib/cn";

/** How long a confirmation stays (design spec §11: short confirmations only). */
const DURATION_MS = 3000;
/** A toast with an action («Вернуть») stays longer, so there is time to reach it. */
const ACTION_DURATION_MS = 6000;
const MAX_VISIBLE = 3;

export interface ToastAction {
  label: string;
  onClick(): void;
}

interface ToastItem {
  id: number;
  text: string;
  tone: "default" | "error";
  action?: ToastAction;
}

let items: readonly ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

const hide = (id: number) => {
  items = items.filter((item) => item.id !== id);
  emit();
};

function show(text: string, tone: ToastItem["tone"], action?: ToastAction) {
  const id = nextId++;
  items = [...items, { id, text, tone, ...(action ? { action } : {}) }].slice(-MAX_VISIBLE);
  emit();
  setTimeout(() => hide(id), action ? ACTION_DURATION_MS : DURATION_MS);
}

/**
 * «Ссылка скопирована»: `toast(text)`, `toast.error(text)`; «Расчёт убран · Вернуть»: `toast(text, { action })`.
 * Works once `Toaster` is mounted.
 */
export const toast = Object.assign(
  (text: string, options?: { action?: ToastAction }) => show(text, "default", options?.action),
  {
    error: (text: string) => show(text, "error"),
  },
);

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
          <span className="flex-1">{item.text}</span>
          {item.action ? (
            <button
              type="button"
              className="pointer-events-auto -my-2 -mr-2 min-h-12 rounded-md px-3 underline underline-offset-4 hover:bg-white/10"
              onClick={() => {
                item.action?.onClick();
                hide(item.id);
              }}
            >
              {item.action.label}
            </button>
          ) : null}
        </p>
      ))}
    </div>
  );
}
