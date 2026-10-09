"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, toast } from "sonner";

/** Mount once in the root layout. Short confirmations only: «Ссылка скопирована». */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      duration={3000}
      style={{ zIndex: "var(--z-toast)" } as CSSProperties}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[calc(100vw-2rem)] max-w-sm items-center gap-3 rounded-lg bg-text px-4 py-3 text-body-strong text-bg shadow-lg",
          error: "bg-danger text-white",
        },
      }}
    />
  );
}

export { toast };
