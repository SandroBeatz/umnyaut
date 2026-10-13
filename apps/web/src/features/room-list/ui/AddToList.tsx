"use client";

import { shell, type ToolDef } from "@umnyaut/catalog";
import { Button, toast } from "@umnyaut/ui";
import { Check, ListPlus, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { hydrateEstimate, selectActiveCalcs, useEstimateStore } from "@/entities/estimate";
import type { ToolValues } from "@/entities/tool";
import { ownInput } from "../model/input";

const t = shell.roomList;

export interface AddToListProps {
  tool: ToolDef;
  /** Formula version of the tool's calc module, stored with the calc. */
  version: number;
  values: ToolValues;
  defaults: ToolValues;
  /** Creates the room from the form first, so the list never sits in a room without sizes. */
  onBeforeAdd?(): void;
  className?: string;
}

/** «В список» → «В списке» once added; «Обновить в списке» when the tool's own input changed since. */
export function AddToList({ tool, version, values, defaults, onBeforeAdd, className }: AddToListProps) {
  useEffect(() => {
    void hydrateEstimate();
  }, []);
  const entry = useEstimateStore((s) => selectActiveCalcs(s).find((c) => c.tool === tool.id));
  const put = useEstimateStore((s) => s.putToolCalc);
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
        onBeforeAdd?.();
        put({ tool: tool.id, toolVersion: version, input });
        if (state === "add") toast(t.addedToast);
      }}
    >
      {state === "add" ? <ListPlus aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
      {state === "add" ? t.add : t.update}
    </Button>
  );
}
