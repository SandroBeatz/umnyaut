import { shell } from "@umnyaut/catalog";
import { cn } from "@umnyaut/ui";
import { ArrowRight, ArrowUp } from "lucide-react";
import Link from "next/link";

export interface StickyResultBarProps {
  text: string;
  visible: boolean;
  /** The calc is in the estimate: the bar leads to it, «10 пачек · К списку» (spec «Калькулятор»). */
  inEstimate?: boolean;
}

/**
 * Phone only (< 1024 px): the result line while `ResultPanel` is off-screen; tap scrolls back to it. Sits on top
 * of the cookie banner while that is open (`--cookie-h`).
 */
export function StickyResultBar({ text, visible, inEstimate }: StickyResultBarProps) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-[var(--cookie-h,0px)] z-[var(--z-sticky-result)] border-border border-t bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg transition-[opacity,translate] duration-200 ease-standard lg:hidden print:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 text-text">
        <a href="#result" tabIndex={visible ? 0 : -1} className="flex h-full min-w-0 flex-1 items-center gap-1">
          <span className="truncate text-quantity tabular-nums">{text}</span>
          {inEstimate ? null : (
            <span className="ml-auto inline-flex items-center gap-1 text-small font-semibold text-primary">
              {shell.sticky.toResult}
              <ArrowUp aria-hidden="true" className="size-5" />
            </span>
          )}
        </a>
        {inEstimate ? (
          <Link
            href="/spisok/"
            tabIndex={visible ? 0 : -1}
            className="inline-flex h-full shrink-0 items-center gap-1 text-small font-semibold text-primary"
          >
            {shell.sticky.toEstimate}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
