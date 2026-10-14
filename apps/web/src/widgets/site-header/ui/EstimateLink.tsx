import { shell } from "@umnyaut/catalog";
import { cn } from "@umnyaut/ui";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

export const ESTIMATE_PATH = "/spisok/";

export interface EstimateLinkProps {
  /** On the estimate page: teal. */
  here?: boolean;
  /** «94 950 ₽»; none while the estimate has no sum (or before it is read). */
  sum?: string;
}

/**
 * The header's estimate button, one look everywhere (owner, 2026-10-14): mint with the sum in a white chip. No sum
 * yet — the icon alone; no word on any screen (screen readers hear «Список покупок»).
 */
export function EstimateLink({ here, sum }: EstimateLinkProps) {
  return (
    <Link
      href={ESTIMATE_PATH}
      aria-current={here ? "page" : undefined}
      className={cn(
        "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-md bg-primary-soft text-body-strong text-primary-hover transition-colors hover:bg-surface-mint",
        sum ? "px-2.5" : "px-0",
      )}
      data-estimate-button
    >
      <ClipboardList aria-hidden="true" className="size-5 shrink-0" />
      <span className="sr-only">{shell.header.estimate}</span>
      {sum ? (
        <span className="rounded-sm bg-surface px-2 text-small font-semibold text-text tabular-nums" data-header-sum>
          {sum}
        </span>
      ) : null}
    </Link>
  );
}
