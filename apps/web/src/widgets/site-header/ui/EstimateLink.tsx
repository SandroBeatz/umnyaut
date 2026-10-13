import { shell } from "@umnyaut/catalog";
import { cn } from "@umnyaut/ui";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

export const ESTIMATE_PATH = "/smeta/";

export interface EstimateLinkProps {
  /** On the estimate page: teal. */
  here?: boolean;
  /** «94 950 ₽»; none while the estimate has no sum (or before it is read). */
  sum?: string;
}

/** «Смета 94 950 ₽» in a reserved width: the sum arrives after mount without moving anything. */
export function EstimateLink({ here, sum }: EstimateLinkProps) {
  return (
    <Link
      href={ESTIMATE_PATH}
      aria-current={here ? "page" : undefined}
      className={cn(
        "inline-flex h-11 min-w-[7.5rem] items-center justify-center gap-2 rounded-md px-3 text-body-strong transition-colors lg:min-w-[11rem]",
        here
          ? "bg-primary text-on-primary hover:bg-primary-hover"
          : "bg-primary-soft text-primary-hover hover:bg-surface-mint",
      )}
      data-estimate-button
    >
      <ClipboardList aria-hidden="true" className="size-5 shrink-0" />
      <span className={sum ? "sr-only lg:not-sr-only" : undefined}>{shell.header.estimate}</span>
      {sum ? (
        <span
          className={cn(
            "rounded-sm bg-surface px-2 text-small font-semibold tabular-nums",
            here ? "text-primary-hover" : "text-text",
          )}
          data-header-sum
        >
          {sum}
        </span>
      ) : null}
    </Link>
  );
}
