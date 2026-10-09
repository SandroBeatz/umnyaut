import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export const cardVariants = cva("rounded-lg", {
  variants: {
    tone: {
      default: "border border-border bg-surface shadow-sm",
      mint: "bg-surface-mint",
      sunken: "bg-surface-sunken",
      warning: "bg-accent-soft",
    },
    padding: { none: "", md: "p-4", lg: "p-4 lg:p-6" },
  },
  defaultVariants: { tone: "default", padding: "md" },
});

export interface CardProps extends ComponentProps<"div">, VariantProps<typeof cardVariants> {}

export function Card({ className, tone, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ tone, padding }), className)} {...props} />;
}
