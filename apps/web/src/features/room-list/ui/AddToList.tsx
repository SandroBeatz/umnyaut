"use client";

import { shell, type ToolDef } from "@umnyaut/catalog";
import { Button, toast } from "@umnyaut/ui";
import { Check, ListPlus, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import type { ToolValues } from "@/entities/tool";
import { ownInput } from "../model/build";
import { hydrateList, useListStore } from "../model/store";

const t = shell.roomList;

export interface AddToListProps {
  tool: ToolDef;
  values: ToolValues;
  defaults: ToolValues;
  className?: string;
}

/** «В список» → «В списке» once added; «Обновить в списке» when the tool's own input changed since. */
export function AddToList({ tool, values, defaults, className }: AddToListProps) {
  useEffect(() => {
    void hydrateList();
  }, []);
  const entry = useListStore((s) => s.entries.find((e) => e.tool === tool.id));
  const put = useListStore((s) => s.put);
  const input = ownInput(tool, values, defaults);
  const state = !entry ? "add" : JSON.stringify(entry.input) === JSON.stringify(input) ? "added" : "update";

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
        put({ tool: tool.id, input });
        if (state === "add") toast(t.addedToast);
      }}
    >
      {state === "add" ? <ListPlus aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
      {state === "add" ? t.add : t.update}
    </Button>
  );
}
