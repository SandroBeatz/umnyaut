import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap text-body-strong transition-colors disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        /** Orange — only «Рассчитать ремонт», «Показать список покупок», «Посмотреть материал». */
        accent: "bg-accent text-on-accent hover:bg-accent-hover",
        secondary: "border border-border-input bg-surface text-text hover:bg-surface-sunken",
        ghost: "text-primary hover:bg-primary-soft hover:text-primary-hover",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        lg: "h-14 rounded-lg px-6",
        md: "h-12 rounded-md px-5",
        sm: "h-10 rounded-md px-4 text-small font-semibold",
        /** Icon-only: 48 × 48, needs `aria-label`. */
        icon: "size-12 rounded-md [&_svg]:size-6",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Render the child (e.g. a link) with button styles. */
  asChild?: boolean;
  /** Shows a spinner, keeps the width and blocks clicks. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle aria-hidden="true" className="animate-spin" />
          <span className="contents">{children}</span>
        </>
      ) : (
        children
      )}
    </Component>
  );
}
