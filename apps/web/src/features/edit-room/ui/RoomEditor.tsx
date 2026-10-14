"use client";

import type { EstimateRoom, RoomType } from "@umnyaut/calc";
import { shell } from "@umnyaut/catalog";
import { ResponsiveSheet } from "@umnyaut/ui";
import { lazy, type ReactNode, Suspense } from "react";
import type { RoomGeometry } from "@/entities/estimate";

const t = shell.roomEditor;
/** The editor's fields, plan and totals load when it first opens, not with the page. */
const Body = lazy(() => import("./RoomEditorBody"));

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
  return (
    <ResponsiveSheet
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={room ? t.title : t.newTitle}
      closeLabel={shell.close}
      wide
    >
      {open ? (
        <Suspense fallback={<div className="h-96 lg:h-[560px]" />}>
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
