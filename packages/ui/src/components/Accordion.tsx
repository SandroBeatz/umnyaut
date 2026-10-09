"use client";

import { ChevronDown } from "lucide-react";
import { Accordion as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export const Accordion = Primitive.Root;

export function AccordionItem({ className, ...props }: ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item className={cn("border-border border-b last:border-b-0", className)} {...props} />;
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Trigger> & { children: ReactNode }) {
  return (
    <Primitive.Header className="flex">
      <Primitive.Trigger
        className={cn(
          "flex min-h-12 flex-1 items-center justify-between gap-3 py-3 text-left text-body-strong text-text transition-colors hover:text-primary-hover [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-text-muted transition-transform duration-200 ease-standard"
        />
      </Primitive.Trigger>
    </Primitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      className="overflow-hidden text-body text-text-muted data-[state=closed]:animate-[accordion-up_200ms_var(--ease-standard)] data-[state=open]:animate-[accordion-down_200ms_var(--ease-standard)]"
      {...props}
    >
      <div className={cn("pb-4", className)}>{children}</div>
    </Primitive.Content>
  );
}
