"use client";

import { shell } from "@umnyaut/catalog";
import { reopenConsent } from "@/shared/analytics";

/** Footer «Настройки cookie»: shows the banner again so the choice can be changed. */
export function CookieSettings({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={reopenConsent}>
      {shell.footer.cookies}
    </button>
  );
}
