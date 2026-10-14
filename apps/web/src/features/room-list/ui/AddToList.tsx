"use client";

import { shell } from "@umnyaut/catalog";
import { Button, toast } from "@umnyaut/ui";
import { Check, ListPlus, RefreshCw } from "lucide-react";

const t = shell.toEstimate;

export interface AddToListProps {
  /** Not in the estimate; in it with unsaved edits; in it as shown. */
  state: "add" | "update" | "added";
  onAdd(): void;
  onUpdate(): void;
  className?: string;
}

/**
 * «Добавить в список» → «В списке»; after a change «Обновить в списке» (spec Р4, owner 2026-10-13): the estimate takes
 * a calc and its edits only by this button.
 */
export function AddToList({ state, onAdd, onUpdate, className }: AddToListProps) {
  if (state === "update") {
    return (
      <Button
        className={className}
        onClick={() => {
          onUpdate();
          toast(t.updatedToast);
        }}
      >
        <RefreshCw aria-hidden="true" />
        {t.update}
      </Button>
    );
  }
  if (state === "added") {
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
