"use client";

import type { EstimateRoom, RoomType } from "@umnyaut/calc";
import { shell } from "@umnyaut/catalog";
import { ResponsiveSheet } from "@umnyaut/ui";
import { lazy, type ReactNode, Suspense, useEffect } from "react";
import type { RoomGeometry } from "@/entities/estimate";

const t = shell.roomEditor;
/** The editor's fields, plan and totals load when it first opens, not with the page. */
const loadBody = () => import("./RoomEditorBody");
const Body = lazy(loadBody);

export interface RoomEditorProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  /** The room to edit; `null` — a new one. */
  room: EstimateRoom | null;
  /** What the calculator counts with: fills what the room does not know yet (sizes, doors and windows). */
  draft?: RoomGeometry;
  newName: string;
  /** A new room's type («Спальня» when the flat has a «Зал»). */
  newType?: RoomType;
  /** The save button's label; «Сохранить комнату» by default. */
  saveLabel?: string;
  /** After a save, with the room's id. */
  onSaved?: (id: string) => void;
  /** One element; opens the editor. */
  trigger: ReactNode;
}

/** One room editor for the whole site (spec «Редактор комнаты»): bottom sheet on the phone, popup from 1024 px. */
export function RoomEditor({
  open,
  onOpenChange,
  room,
  draft,
  newName,
  newType,
  saveLabel,
  onSaved,
  trigger,
}: RoomEditorProps) {
  // Fetched with the sheet, not after it: the body would otherwise wait for the sheet's code to arrive first.
  useEffect(() => {
    if (open) void loadBody();
  }, [open]);
  return (
    <ResponsiveSheet
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={room ? t.title : t.newTitle}
      closeLabel={shell.close}
      wide
    >
      {/* The editor is always taller than the sheet or dialog can be, so they open at their full height: a shorter
          placeholder would let the sheet grow upward once the body loads — a layout shift (CLS 0.30 on a calculator
          that opens the editor by itself). */}
      {open ? (
        <Suspense fallback={<div className="h-dvh" />}>
          <Body
            key={room?.id ?? "new"}
            room={room}
            {...(draft ? { draft } : {})}
            newName={newName}
            {...(newType ? { newType } : {})}
            {...(saveLabel ? { saveLabel } : {})}
            {...(onSaved ? { onSaved } : {})}
            onDone={() => onOpenChange(false)}
          />
        </Suspense>
      ) : null}
    </ResponsiveSheet>
  );
}
