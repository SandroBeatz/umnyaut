"use client";

import { ESTIMATE_LIMITS } from "@umnyaut/calc";
import { shell, unitLabels } from "@umnyaut/catalog";
import { Button, NumberField, ResponsiveSheet } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { Check, ChevronDown, Plus, Ruler } from "lucide-react";
import { useEffect, useState } from "react";
import { hydrateEstimate, useActiveRoom, useEstimateStore } from "@/entities/estimate";
import { type RoomDraft, roomDimensions } from "@/entities/room";
import { fill } from "@/shared/lib";

const t = shell.roomBar;
const m = unitLabels.m;
const LIMITS = { lengthMm: [300, 100_000], widthMm: [300, 100_000], heightMm: [1000, 10_000] } as const;
type Part = keyof typeof LIMITS;

const toM = (mm: number | undefined) => (mm === undefined ? null : mm / 1000);
const range = ([min, max]: readonly [number, number]) =>
  fill(shell.form.range, { min: formatNumber(min / 1000), max: formatNumber(max / 1000), unit: m });
/** «Плитка» → «плитка есть». */
const counted = (title: string) => fill(t.counted, { tool: title.charAt(0).toLowerCase() + title.slice(1) });

export interface RoomBarProps {
  /** The calculator the row stands in: rooms where it is counted get «плитка есть». */
  tool?: { id: string; title: string };
}

/**
 * The mint room row (spec «Калькулятор», P17.7): «[Ванная ▾] 2,2 × 1,7 × 2,5 м · Изменить». The name opens the
 * estimate's rooms with «+ Новая комната»; «Изменить» edits the sizes. The server renders the empty state; the
 * stored room appears after mount at the same 56 px height (no layout shift).
 */
export function RoomBar({ tool }: RoomBarProps) {
  const room = useActiveRoom();
  const rooms = useEstimateStore((s) => s.estimate?.rooms);
  const calcs = useEstimateStore((s) => s.estimate?.calcs);
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<Part, number | null>>({ lengthMm: null, widthMm: null, heightMm: null });

  useEffect(() => {
    void hydrateEstimate();
  }, []);

  const onOpenChange = (next: boolean) => {
    if (next) setDraft({ lengthMm: toM(room?.lengthMm), widthMm: toM(room?.widthMm), heightMm: toM(room?.heightMm) });
    setOpen(next);
  };

  const valid = (part: Part) => {
    const value = draft[part];
    if (value === null) return true;
    const mm = Math.round(value * 1000);
    return mm >= LIMITS[part][0] && mm <= LIMITS[part][1];
  };
  const canSave = (Object.keys(LIMITS) as Part[]).every(valid);

  const save = () => {
    const patch: RoomDraft = {};
    for (const part of Object.keys(LIMITS) as Part[]) {
      const value = draft[part];
      if (value !== null) patch[part] = Math.round(value * 1000);
    }
    useEstimateStore.getState().patchActiveRoom(patch);
    setOpen(false);
  };

  const dimensions = roomDimensions(room, m);

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
                    useEstimateStore.getState().addRoom();
                    setPicking(false);
                  }}
                >
                  <Plus aria-hidden="true" className="size-5" />
                  {t.newRoom}
                </button>
              </li>
            ) : null}
          </ul>
        </ResponsiveSheet>
      ) : (
        <p className="min-w-0 flex-1 truncate font-semibold">{t.empty}</p>
      )}
      <ResponsiveSheet
        open={open}
        onOpenChange={onOpenChange}
        title={room?.name ?? t.sheetTitle}
        description={t.sheetDescription}
        closeLabel={shell.close}
        trigger={
          <Button variant="ghost" size="md" className="shrink-0">
            {t.edit}
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 pt-2">
          {(
            [
              ["lengthMm", t.length],
              ["widthMm", t.width],
              ["heightMm", t.height],
            ] as const
          ).map(([part, label]) => (
            <NumberField
              key={part}
              label={label}
              unit={m}
              value={draft[part]}
              onValueChange={(value) => setDraft((d) => ({ ...d, [part]: value }))}
              min={LIMITS[part][0] / 1000}
              max={LIMITS[part][1] / 1000}
              messages={{ range: range(LIMITS[part]) }}
            />
          ))}
        </div>
        <Button size="lg" className="mt-4 w-full" disabled={!canSave} onClick={save}>
          {t.save}
        </Button>
      </ResponsiveSheet>
    </div>
  );
}
