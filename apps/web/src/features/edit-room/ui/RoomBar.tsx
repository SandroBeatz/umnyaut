"use client";

import { shell, unitLabels } from "@umnyaut/catalog";
import { Button, NumberField, ResponsiveSheet } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { Ruler } from "lucide-react";
import { useEffect, useState } from "react";
import { hydrateRoom, type RoomDraft, roomDimensions, useRoomStore } from "@/entities/room";
import { fill } from "@/shared/lib";

const t = shell.roomBar;
const m = unitLabels.m;
const LIMITS = { lengthMm: [300, 100_000], widthMm: [300, 100_000], heightMm: [1000, 10_000] } as const;
type Part = keyof typeof LIMITS;

const toM = (mm: number | undefined) => (mm === undefined ? null : mm / 1000);
const range = ([min, max]: readonly [number, number]) =>
  fill(shell.form.range, { min: formatNumber(min / 1000), max: formatNumber(max / 1000), unit: m });

/**
 * «Моя комната: 4,6 × 4,3 × 2,7 м · Изменить» (design spec §11). The server renders the empty state;
 * the stored room appears after mount.
 */
export function RoomBar() {
  const room = useRoomStore((s) => s.room);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<Part, number | null>>({ lengthMm: null, widthMm: null, heightMm: null });

  useEffect(() => {
    void hydrateRoom();
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
    useRoomStore.getState().updateRoom(patch);
    setOpen(false);
  };

  const dimensions = roomDimensions(room, m);

  return (
    <div className="flex min-h-12 items-center gap-3 rounded-md bg-surface-mint pl-3 text-small text-text">
      <Ruler aria-hidden="true" className="size-5 shrink-0 text-primary-hover" />
      <p className="min-w-0 flex-1 truncate">
        {dimensions ? (
          <>
            {t.label}: <span className="font-semibold tabular-nums">{dimensions}</span>
          </>
        ) : (
          <span className="font-semibold">{t.empty}</span>
        )}
      </p>
      <ResponsiveSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t.sheetTitle}
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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="sm:flex-1" disabled={!canSave} onClick={save}>
            {t.save}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="sm:flex-1"
            onClick={() => {
              useRoomStore.getState().clearRoom();
              setOpen(false);
            }}
          >
            {t.clear}
          </Button>
        </div>
      </ResponsiveSheet>
    </div>
  );
}
