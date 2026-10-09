import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

/** 48 px circle on `primary-soft` with a 24 px icon in `primary-hover`. Decorative by default. */
export function IconCircle({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-hover [&_svg]:size-6",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
