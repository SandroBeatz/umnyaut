import { cn, Mascot } from "@umnyaut/ui";
import type { ReactNode } from "react";
import { mascotImages } from "@/shared/config";

/**
 * Every hint, warning and note: the cat's head (40 px), never the whole cat — design system rule
 * (docs/design/design-system.md → Mascot). Use this component instead of placing the mascot by hand.
 */
export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-md bg-accent-soft p-3", className)}>
      <Mascot image={mascotImages.head} size={40} alt="" className="shrink-0" />
      <div className="min-w-0 self-center text-small text-text">{children}</div>
    </div>
  );
}
