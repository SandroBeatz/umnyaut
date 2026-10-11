"use client";

import { Button } from "@umnyaut/ui";
import { ChevronDown, type LucideIcon, X } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

export interface CollapsibleCardProps {
  icon: LucideIcon;
  title: string;
  /** One line under the title while closed and open: «80 × 200 см · 1 шт.». */
  summary?: string;
  open: boolean;
  onOpenChange(open: boolean): void;
  removeLabel: string;
  onRemove(): void;
  children: ReactNode;
}

/**
 * A door or window card: the header (icon, name, summary) opens and closes the fields, the cross removes the
 * card. Closed fields stay mounted (only hidden), so a typed value or its error survives closing.
 */
export function CollapsibleCard({
  icon: Icon,
  title,
  summary,
  open,
  onOpenChange,
  removeLabel,
  onRemove,
  children,
}: CollapsibleCardProps) {
  const bodyId = useId();
  return (
    <div className="rounded-md border border-border">
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!open)}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-md py-2 pl-3 text-left"
        >
          <Icon aria-hidden="true" className="size-5 shrink-0 text-primary-hover" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body-strong text-text">{title}</span>
            {summary ? <span className="text-small text-text-muted tabular-nums">{summary}</span> : null}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={open ? "size-5 shrink-0 rotate-180 text-primary" : "size-5 shrink-0 text-primary"}
          />
        </button>
        <Button variant="ghost" size="icon" aria-label={removeLabel} onClick={onRemove}>
          <X />
        </Button>
      </div>
      <div id={bodyId} hidden={!open} className="px-3 pb-3">
        {children}
      </div>
    </div>
  );
}

/**
 * Which cards of a list are open. All start closed; a card added by the user opens. Indices after a removed card
 * shift down with it.
 */
export function useOpenCards() {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  return {
    isOpen: (index: number) => open.has(index),
    setOpen: (index: number, next: boolean) =>
      setOpen((current) => {
        const copy = new Set(current);
        if (next) copy.add(index);
        else copy.delete(index);
        return copy;
      }),
    removed: (index: number) =>
      setOpen((current) => new Set([...current].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)))),
  };
}
