"use client";

import type { ToolId } from "@umnyaut/calc";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConsent } from "./consent";
import { loadMetrika, metrikaEnabled, metrikaHit } from "./metrika";
import { analyticsContext, track } from "./track";

/** A broken page should not flood the counter. */
const MAX_ERRORS = 5;

/**
 * Root-layout piece without markup: loads Metrika once the visitor accepts, sends a page view per route
 * (Next navigations included) and reports uncaught errors as `js_error`.
 */
export function Analytics() {
  const consent = useConsent();
  const pathname = usePathname();
  const previous = useRef<string | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new pathname is a new page view
  useEffect(() => {
    if (consent !== "accepted" || !metrikaEnabled()) return;
    loadMetrika();
    metrikaHit(window.location.href, previous.current ?? document.referrer);
    previous.current = window.location.href;
  }, [consent, pathname]);

  useEffect(() => {
    let errors = 0;
    const report = () => {
      if (errors++ >= MAX_ERRORS) return;
      track("js_error", { tool: analyticsContext().tool as ToolId | undefined });
    };
    window.addEventListener("error", report);
    window.addEventListener("unhandledrejection", report);
    return () => {
      window.removeEventListener("error", report);
      window.removeEventListener("unhandledrejection", report);
    };
  }, []);

  return null;
}
