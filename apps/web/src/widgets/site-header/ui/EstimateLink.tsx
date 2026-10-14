import { shell } from "@umnyaut/catalog";
import { cn } from "@umnyaut/ui";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

export const ESTIMATE_PATH = "/spisok/";

export interface EstimateLinkProps {
  /** On the estimate page: `aria-current`. */
  here?: boolean;
  /** Calcs in the list; none while it is empty (or before it is read). */
  count?: number;
}

/**
 * The header's list button (owner, 2026-10-14): no border, the number of calcs in the list in a mint circle. From the
 * desktop up the icon, «Список» and the count; on the phone the icon and the count, the icon alone while empty.
 * Screen readers hear «Список покупок».
 */
export function EstimateLink({ here, count }: EstimateLinkProps) {
  return (
    <Link
      href={ESTIMATE_PATH}
      aria-current={here ? "page" : undefined}
      className={cn(
        "inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-lg bg-surface text-body-strong text-text transition-colors hover:bg-surface-sunken",
        count ? "px-2.5 lg:px-3" : "px-0 lg:px-3",
      )}
      data-estimate-button
    >
      <ClipboardList aria-hidden="true" className="size-5 shrink-0" />
      <span className="sr-only">{shell.header.estimate}</span>
      <span aria-hidden="true" className="hidden lg:inline">
        {shell.header.estimateShort}
      </span>
      {count ? (
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-primary-soft text-small font-semibold text-primary-hover tabular-nums"
          data-header-count
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
