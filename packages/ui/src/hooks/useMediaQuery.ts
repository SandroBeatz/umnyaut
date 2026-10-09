"use client";

import { useSyncExternalStore } from "react";

/**
 * `false` on the server and during hydration, the real value right after mount — so the first client
 * render always equals the server render (AGENTS.md rule 4).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const DESKTOP_QUERY = "(min-width: 1024px)";
