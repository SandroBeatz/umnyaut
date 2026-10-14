"use client";

import { ESTIMATE_LIMITS } from "@umnyaut/calc";
import { shell, unitLabels } from "@umnyaut/catalog";
import { Button, ResponsiveSheet } from "@umnyaut/ui";
import { Check, ChevronDown, Plus, Ruler } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { freeRoomName, hydrateEstimate, type RoomGeometry, useActiveRoom, useEstimateStore } from "@/entities/estimate";
import { roomDimensions } from "@/entities/room";
import { fill } from "@/shared/lib";
import { RoomEditor } from "./RoomEditor";

const t = shell.roomBar;
const m = unitLabels.m;
/** «Плитка» → «плитка есть». */
const counted = (title: string) => fill(t.counted, { tool: title.charAt(0).toLowerCase() + title.slice(1) });
/** Closed once this visit: the editor does not open by itself on the next calculator. */
const ASKED_KEY = "umnyaut:room-asked:v1";

function asked(): boolean {
  try {
    return window.sessionStorage.getItem(ASKED_KEY) === "1";
  } catch {
    return false;
  }
}

function markAsked() {
  try {
    window.sessionStorage.setItem(ASKED_KEY, "1");
  } catch {
    // Blocked storage: the editor may open again on the next calculator.
  }
}

function withoutFloor({ lengthMm: _, widthMm: __, ...rest }: RoomGeometry): RoomGeometry {
  return rest;
}

export interface RoomBarProps {
  /** The calculator the row stands in: rooms where it is counted get «плитка есть». */
  tool?: { id: string; title: string };
  /** What the calculator counts with now (sizes, shape, doors and windows): the row's sizes and the editor start here. */
  draft?: RoomGeometry;
  /** The calculator counts the tool's example: a page without rooms asks for the room first. */
  example?: boolean;
}

/**
 * The mint room row (spec «Калькулятор», P17.7), 56 px in both states so nothing shifts after mount. Without a room
 * the row says what is counted («Пример: 4,6 × 4,3 м») and «Указать размеры» opens the room editor; a page that
 * counts the example and finds no room in the estimate opens the editor by itself after mount, once a visit (owner,
 * 2026-10-14). With a room: «[Ванная ▾] 2,2 × 1,7 × 2,5 м · Изменить», the name opens the estimate's rooms.
 */
export function RoomBar({ tool, draft, example = false }: RoomBarProps) {
  const room = useActiveRoom();
  const rooms = useEstimateStore((s) => s.estimate?.rooms);
  const calcs = useEstimateStore((s) => s.estimate?.calcs);
  const [picking, setPicking] = useState(false);
  /** The editor is open on the active room, or on a new one («+ Новая комната»). */
  const [editing, setEditing] = useState<{ open: boolean; isNew: boolean }>({ open: false, isNew: false });
  /** The store has loaded: only then is «no rooms» known (a link's sizes are in the values by that render). */
  const [loaded, setLoaded] = useState(false);
  const asking = useRef(false);

  useEffect(() => {
    void hydrateEstimate().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || asking.current) return;
    asking.current = true;
    if (example && !rooms?.length && !asked()) setEditing({ open: true, isNew: false });
  }, [loaded, example, rooms]);

  const dimensions = roomDimensions(room, m);
  /**
   * The example's length and width stay out of the editor — the user types their own; its height, doors and window
   * are a start. A link's sizes come in whole.
   */
  const start = editing.isNew || !draft ? {} : { draft: !room && example ? withoutFloor(draft) : draft };

  const editor = (
    <RoomEditor
      open={editing.open}
      onOpenChange={(open) => {
        setEditing((e) => ({ open, isNew: open && e.isNew }));
        if (!open) markAsked();
      }}
      room={editing.isNew ? null : room}
      {...start}
      newName={freeRoomName(rooms ?? [])}
      trigger={
        <Button variant="ghost" size="md" className="shrink-0">
          {room ? t.edit : t.add}
        </Button>
      }
    />
  );

  if (!room) {
    const sizes = roomDimensions(draft ?? null, m);
    return (
      <div className="flex h-14 items-center gap-2 rounded-md bg-surface-mint pl-3 text-small text-text">
        <Ruler aria-hidden="true" className="size-5 shrink-0 text-primary-hover" />
        <span className="flex min-w-0 flex-1 flex-col leading-5">
          <span className="truncate text-body font-semibold leading-5">{t.noRoom}</span>
          {sizes ? (
            <span className="truncate text-text-muted tabular-nums" data-room-example>
              {example ? fill(t.example, { dimensions: sizes }) : sizes}
            </span>
          ) : null}
        </span>
        {editor}
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center gap-2 rounded-md bg-surface-mint pl-3 text-small text-text">
      <Ruler aria-hidden="true" className="size-5 shrink-0 text-primary-hover" />
      {rooms ? (
        <ResponsiveSheet
          open={picking}
          onOpenChange={setPicking}
          title={t.pickTitle}
          description={t.pickDescription}
          closeLabel={shell.close}
          trigger={
            <button
              type="button"
              className="flex min-h-12 min-w-0 flex-1 items-center gap-1.5 text-left"
              aria-label={fill(t.pickLabel, { room: room.name, dimensions: dimensions ?? t.noSizes })}
            >
              <span className="flex min-w-0 flex-col leading-5">
                <span className="truncate text-body font-semibold leading-5">{room.name}</span>
                <span className="truncate text-text-muted tabular-nums" data-room-dimensions>
                  {dimensions ?? t.noSizes}
                </span>
              </span>
              <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary-hover" />
            </button>
          }
        >
          <ul className="flex flex-col gap-1 pt-2">
            {rooms.map((r) => {
              const active = r.id === room.id;
              const here = tool && calcs?.some((c) => c.roomId === r.id && c.tool === tool.id);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    aria-current={active || undefined}
                    className="flex min-h-14 w-full items-center gap-3 rounded-md px-3 text-left hover:bg-surface-sunken aria-[current]:bg-primary-soft"
                    onClick={() => {
                      useEstimateStore.getState().setActiveRoom(r.id);
                      setPicking(false);
                    }}
                  >
                    <span className="flex min-w-0 flex-1 flex-col leading-5">
                      <span className="truncate text-body font-semibold leading-5">{r.name}</span>
                      <span className="text-small text-text-muted tabular-nums">
                        {roomDimensions(r, m) ?? t.noSizes}
                      </span>
                    </span>
                    {here ? (
                      <span className="shrink-0 rounded-sm bg-surface-mint px-2 text-small text-primary-hover">
                        {counted(tool.title)}
                      </span>
                    ) : null}
                    {active ? <Check aria-hidden="true" className="size-5 shrink-0 text-primary" /> : null}
                  </button>
                </li>
              );
            })}
            {rooms.length < ESTIMATE_LIMITS.rooms ? (
              <li>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 rounded-md px-3 text-left text-body font-semibold text-primary hover:bg-surface-sunken"
                  onClick={() => {
                    setPicking(false);
                    setEditing({ open: true, isNew: true });
                  }}
                >
                  <Plus aria-hidden="true" className="size-5" />
                  {t.newRoom}
                </button>
              </li>
            ) : null}
          </ul>
        </ResponsiveSheet>
      ) : null}
      {editor}
    </div>
  );
}
