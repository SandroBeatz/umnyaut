import type { KeyboardEvent } from "react";

const STEP: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Arrow keys, Home and End inside a radio group (WAI-ARIA radio pattern): focus moves to the next item and
 * selects it, like native radios. Items carry `data-roving`; the group has one Tab stop (`rovingTabIndex`).
 */
export function onRovingKeyDown(event: KeyboardEvent<HTMLElement>): void {
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-roving]:not(:disabled)")];
  const index = items.indexOf(document.activeElement as HTMLElement);
  if (index < 0 || items.length === 0) return;
  const step = STEP[event.key];
  const next =
    step !== undefined
      ? (index + step + items.length) % items.length
      : event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : undefined;
  if (next === undefined) return;
  event.preventDefault();
  items[next]?.focus();
  items[next]?.click();
}

/** The checked item is the group's Tab stop; with nothing checked, the first one. */
export function rovingTabIndex(checked: boolean, index: number, anyChecked: boolean): 0 | -1 {
  return checked || (!anyChecked && index === 0) ? 0 : -1;
}
