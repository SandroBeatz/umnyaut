"use client";

import { shell } from "@umnyaut/catalog";
import { Button } from "@umnyaut/ui";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { setConsent, useConsent } from "@/shared/analytics";

const t = shell.consent;
/** CSS variable the sticky result bar sits on, so the banner never covers it. */
const HEIGHT_VAR = "--cookie-h";

/**
 * Narrow bottom bar (design spec §11, ≤ 96 px on a phone): one line, two equal `secondary` buttons, policy link.
 * No wall, nothing pre-checked; the site works the same after either answer. Rendered after mount only.
 */
export function CookieBanner() {
  const consent = useConsent();
  const open = consent === "ask";
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = bar.current;
    const root = document.documentElement;
    if (!open || !node) return;
    const observer = new ResizeObserver(() => root.style.setProperty(HEIGHT_VAR, `${node.offsetHeight}px`));
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.removeProperty(HEIGHT_VAR);
    };
  }, [open]);

  if (!open) return null;
  return (
    <section
      ref={bar}
      aria-label={t.label}
      className="fixed inset-x-0 bottom-0 z-[var(--z-cookie)] border-border border-t bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg print:hidden"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-1.5 px-4 py-2 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:px-8">
        <p className="text-small text-text sm:flex-1">
          {t.text}{" "}
          <Link href="/politika/" className="font-semibold text-primary underline-offset-2 hover:underline">
            {t.more}
          </Link>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:w-80">
          <Button variant="secondary" onClick={() => setConsent("accepted")}>
            {t.accept}
          </Button>
          <Button variant="secondary" onClick={() => setConsent("declined")}>
            {t.decline}
          </Button>
        </div>
      </div>
    </section>
  );
}
