"use client";

import { ESTIMATE_LIMITS } from "@umnyaut/calc";
import { shell, unitLabels } from "@umnyaut/catalog";
import { Button, NumberField, ResponsiveSheet } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { Check, ChevronDown, PencilRuler, Plus, Ruler } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  freeRoomName,
  hydrateEstimate,
  type RoomGeometry,
  selectActiveRoom,
  useActiveRoom,
  useEstimateStore,
} from "@/entities/estimate";
import { roomDimensions } from "@/entities/room";
import { fill } from "@/shared/lib";
import { RoomEditor } from "./RoomEditor";

const t = shell.roomBar;
const m = unitLabels.m;
/** «Плитка» → «плитка есть». */
const counted = (title: string) => fill(t.counted, { tool: title.charAt(0).toLowerCase() + title.slice(1) });

export type SizePart = "lengthMm" | "widthMm" | "heightMm";
const LIMITS: Readonly<Record<SizePart, readonly [number, number]>> = {
  lengthMm: [300, 100_000],
  widthMm: [300, 100_000],
  heightMm: [1000, 10_000],
};

export interface RoomBarProps {
  /** The calculator the row stands in: rooms where it is counted get «плитка есть». */
  tool?: { id: string; title: string };
  /** What the calculator counts with now (sizes, shape, doors and windows): the row's fields and the editor start here. */
  draft?: RoomGeometry;
  /** Sizes typed in the row while the page has no room; by default length, width and height. */
  parts?: readonly SizePart[];
  /** A typed size; by default it goes straight to the room. */
  onSizes?(patch: RoomGeometry): void;
  /** A size out of range: the calculator keeps the last result and says so. */
  onInvalid?(part: SizePart, invalid: boolean): void;
  /** м or см for the size fields, as the form's switch says. */
  unit?: "m" | "cm";
}

/**
 * The mint room row (spec «Калькулятор», P17.7), 56 px in both states so nothing shifts after mount. A page that
 * opens without a room shows length and width (and height) right in the row — the first size creates «Комната 1»
 * silently — and a button into the room editor for shape, doors and windows; the row stays that way while the user
 * types. With a room: «[Ванная ▾] 2,2 × 1,7 × 2,5 м · Изменить», the name opens the estimate's rooms.
 */
export function RoomBar({
  tool,
  draft,
  parts = ["lengthMm", "widthMm", "heightMm"],
  onSizes,
  onInvalid,
  unit = "m",
}: RoomBarProps) {
  const per = unit === "cm" ? 10 : 1000;
  const unitText = shell.form.unitLabels[unit];
  const room = useActiveRoom();
  const rooms = useEstimateStore((s) => s.estimate?.rooms);
  const calcs = useEstimateStore((s) => s.estimate?.calcs);
  const [picking, setPicking] = useState(false);
  /** The editor is open on the active room, or on a new one («+ Новая комната»). */
  const [editing, setEditing] = useState<{ open: boolean; isNew: boolean }>({ open: false, isNew: false });
  /** The server knows no room: fields first; a stored room replaces them after mount. */
  const [fields, setFields] = useState(true);
  const [invalid, setInvalid] = useState<ReadonlySet<SizePart>>(() => new Set());
  /** Typed before the store loaded: the fields stay under the finger instead of turning into the room row. */
  const typed = useRef(false);

  useEffect(() => {
    void hydrateEstimate().then(() => {
      if (!typed.current && selectActiveRoom(useEstimateStore.getState())) setFields(false);
    });
  }, []);

  const save = onSizes ?? ((patch: RoomGeometry) => useEstimateStore.getState().patchActiveRoom(patch));
  const write = (patch: RoomGeometry) => {
    typed.current = true;
    save(patch);
  };
  const dimensions = roomDimensions(room, m);
  const showFields = fields || !room;

  const editor = (
    <RoomEditor
      open={editing.open}
      onOpenChange={(open) => {
        setEditing((e) => ({ open, isNew: open && e.isNew }));
        if (!open && selectActiveRoom(useEstimateStore.getState())) setFields(false);
      }}
      room={editing.isNew ? null : room}
      {...(editing.isNew || !draft ? {} : { draft })}
      newName={freeRoomName(rooms ?? [])}
      trigger={
        showFields ? (
          <Button variant="ghost" size="icon" className="shrink-0" aria-label={t.editor}>
            <PencilRuler aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="ghost" size="md" className="shrink-0">
            {t.edit}
          </Button>
        )
      }
    />
  );

  if (showFields) {
    return (
      <div className="flex h-14 items-center gap-2 rounded-md bg-surface-mint pl-3 text-small text-text">
        <Ruler aria-hidden="true" className="size-5 shrink-0 text-primary-hover" />
        <div className="grid min-w-0 flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${parts.length}, 1fr)` }}>
          {parts.map((part) => {
            const [min, max] = LIMITS[part];
            const mm = draft?.[part] ?? room?.[part];
            return (
              <NumberField
                key={part}
                name={`room-${part}`}
                label={t.sizes[part].label}
                compact={{ caption: fill(t.sizes[part].caption, { unit: unitText }) }}
                value={mm === undefined ? null : mm / per}
                min={min / per}
                max={max / per}
                error={
                  invalid.has(part)
                    ? fill(shell.form.range, {
                        min: formatNumber(min / per),
                        max: formatNumber(max / per),
                        unit: unitText,
                      })
                    : undefined
                }
                onValueChange={(value) => {
                  const next = value === null ? Number.NaN : Math.round(value * per);
                  const bad = !(next >= min && next <= max);
                  setInvalid((current) => {
                    if (current.has(part) === bad) return current;
                    const copy = new Set(current);
                    if (bad) copy.add(part);
                    else copy.delete(part);
                    return copy;
                  });
                  onInvalid?.(part, bad);
                  if (!bad) write({ [part]: next });
                }}
              />
            );
          })}
        </div>
        {editor}
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center gap-2 rounded-md bg-surface-mint pl-3 text-small text-text">
      <Ruler aria-hidden="true" className="size-5 shrink-0 text-primary-hover" />
      {room && rooms ? (
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
