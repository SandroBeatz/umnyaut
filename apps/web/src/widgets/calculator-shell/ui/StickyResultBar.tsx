import { shell } from "@umnyaut/catalog";
import { cn } from "@umnyaut/ui";
import { ArrowUp } from "lucide-react";

export interface StickyResultBarProps {
  text: string;
  visible: boolean;
}

/** Phone only (< 1024 px): the result line while `ResultPanel` is off-screen; tap scrolls back to it. */
export function StickyResultBar({ text, visible }: StickyResultBarProps) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[var(--z-sticky-result)] border-border border-t bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg transition-[opacity,translate] duration-200 ease-standard lg:hidden print:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <a
        href="#result"
        tabIndex={visible ? 0 : -1}
        className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 text-text"
      >
        <span className="truncate text-quantity tabular-nums">{text}</span>
        <span className="inline-flex items-center gap-1 text-small font-semibold text-primary">
          {shell.sticky.toResult}
          <ArrowUp aria-hidden="true" className="size-5" />
        </span>
      </a>
    </div>
  );
}
