"use client";

import { shell } from "@umnyaut/catalog";
import { Button, toast } from "@umnyaut/ui";
import { Check, ListPlus } from "lucide-react";

const t = shell.toEstimate;

export interface AddToListProps {
  /** The open calc is already in the estimate. */
  added: boolean;
  onAdd(): void;
  className?: string;
}

/** «Добавить в смету» → «В смете» (spec Р4): the calculator's open calc joins the estimate. */
export function AddToList({ added, onAdd, className }: AddToListProps) {
  if (added) {
    return (
      <Button variant="secondary" className={className} disabled>
        <Check aria-hidden="true" />
        {t.added}
      </Button>
    );
  }
  return (
    <Button
      className={className}
      onClick={() => {
        onAdd();
        toast(t.addedToast);
      }}
    >
      <ListPlus aria-hidden="true" />
      {t.add}
    </Button>
  );
}
