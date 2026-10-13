"use client";

import { shell } from "@umnyaut/catalog";
import { Button, toast } from "@umnyaut/ui";
import { Check, ListPlus } from "lucide-react";

const t = shell.roomList;

export interface AddToListProps {
  /** The open calc is already in the list (the estimate). */
  added: boolean;
  onAdd(): void;
  className?: string;
}

/** «В список» → «В списке»: the calculator's open calc joins the room's list (its own input follows every edit). */
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
