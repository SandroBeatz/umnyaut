import { ChevronDown } from "lucide-react";
import type { ReactNode, SyntheticEvent } from "react";
import { cn } from "../lib/cn";

export interface DisclosureProps {
  title: ReactNode;
  children: ReactNode;
  /** Fires when it opens (analytics). */
  onOpen?: () => void;
  className?: string;
}

/**
 * One collapsible section on native `<details>`: looks like the accordion, costs no JavaScript, opens without
 * hydration and is searchable by the browser's find (plan P9.11). Closed in the server HTML.
 */
export function Disclosure({ title, children, onOpen, className }: DisclosureProps) {
  const toggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) onOpen?.();
  };
  return (
    <details className={cn("group", className)} onToggle={toggle}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-left text-body-strong text-text transition-colors hover:text-primary-hover [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-text-muted transition-transform duration-200 ease-standard group-open:rotate-180"
        />
      </summary>
      <div className="pb-4 text-body text-text-muted">{children}</div>
    </details>
  );
}
