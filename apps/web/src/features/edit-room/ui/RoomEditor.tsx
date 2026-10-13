"use client";

import type { EstimateRoom } from "@umnyaut/calc";
import { shell } from "@umnyaut/catalog";
import { ResponsiveSheet } from "@umnyaut/ui";
import { lazy, type ReactNode, Suspense } from "react";

const t = shell.roomEditor;
/** The editor's fields, plan and totals load when it first opens, not with the page. */
const Body = lazy(() => import("./RoomEditorBody"));

export interface RoomEditorProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  /** The room to edit; `null` — a new one. */
  room: EstimateRoom | null;
  newName: string;
  /** One element; opens the editor. */
  trigger: ReactNode;
}

/** One room editor for the whole site (spec «Редактор комнаты»): bottom sheet on the phone, popup from 1024 px. */
export function RoomEditor({ open, onOpenChange, room, newName, trigger }: RoomEditorProps) {
  return (
    <ResponsiveSheet
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={room ? t.title : t.newTitle}
      description={t.description}
      closeLabel={shell.close}
    >
      {open ? (
        <Suspense fallback={<div className="h-96" />}>
          <Body key={room?.id ?? "new"} room={room} newName={newName} onDone={() => onOpenChange(false)} />
        </Suspense>
      ) : null}
    </ResponsiveSheet>
  );
}
