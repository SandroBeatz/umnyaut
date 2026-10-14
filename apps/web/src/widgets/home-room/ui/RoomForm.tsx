"use client";

import type { EstimateRoom, RoomType } from "@umnyaut/calc";
import { home, shell, unitLabels } from "@umnyaut/catalog";
import { Button, NumberField } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { ArrowRight, Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { freeRoomName, useEstimateStore } from "@/entities/estimate";
import { areaText, RoomScheme } from "@/entities/room";
import { RoomEditor } from "@/features/edit-room";
import { fill } from "@/shared/lib";
import { type ExampleRoom, openingsText, surfacesOf } from "../model/example";
import type { SavedRoomRef } from "../model/rooms";
import { SuggestionsSheet } from "./SuggestionsSheet";

const t = home.room;
const types = shell.roomEditor.types;
const LIMITS = { lengthMm: [300, 100_000], widthMm: [300, 100_000], heightMm: [1000, 10_000] } as const;
export type Part = keyof typeof LIMITS;
const PARTS: readonly (readonly [Part, string])[] = [
  ["lengthMm", t.length],
  ["widthMm", t.width],
  ["heightMm", t.height],
];

const meters = (mm: number) => formatNumber(mm / 1000, { maxFraction: 2 });

export interface RoomFormProps {
  room: ExampleRoom;
  /** The selected chip; none for a room of type «Другое». */
  type: RoomType | undefined;
  onSize(part: Part, mm: number): void;
  onType(type: RoomType): void;
  onSubmit(): void;
  saved: SavedRoomRef | null;
  /** «Все расчёты»: on to the categories. */
  onAll(): void;
  /** The stored room the editor opens on; `null` until there is one. */
  stored: EstimateRoom | null;
  /** Saves the shown room (the example as shown) so the editor has a room to open. */
  onEnsureRoom(): void;
}

const NO_ROOMS: readonly EstimateRoom[] = [];

/**
 * First state of the home room block (`docs/ui/home-room-block.md`): «Какую комнату считаем?», type chips, the
 * scheme, sizes in metres, floor / walls / ceiling, «Посчитать материалы» — the type's usual calculators in a popup.
 */
export function RoomForm({ room, type, onSize, onType, onSubmit, saved, onAll, stored, onEnsureRoom }: RoomFormProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const rooms = useEstimateStore((s) => s.estimate?.rooms ?? NO_ROOMS);
  const openings = openingsText(room);
  const action = openings ? t.openingsEdit : t.openingsAdd;
  const surfaces = surfacesOf(room);

  const change = (part: Part, value: number | null) => {
    if (value === null) return;
    const mm = Math.round(value * 1000);
    if (mm < LIMITS[part][0] || mm > LIMITS[part][1]) return;
    onSize(part, mm);
  };

  return (
    <>
      <h2 className="text-h3">{t.title}</h2>

      <fieldset className="-mx-4 mt-3 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6">
        <legend className="sr-only">{t.typesLabel}</legend>
        {t.types.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={type === value}
            onClick={() => onType(value)}
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-small font-medium text-text transition-colors hover:border-border-input aria-pressed:border-transparent aria-pressed:bg-primary-soft aria-pressed:font-semibold aria-pressed:text-primary-hover"
          >
            {type === value ? <Check aria-hidden="true" className="size-4" strokeWidth={3} /> : null}
            {types[value]}
          </button>
        ))}
      </fieldset>

      <RoomScheme
        lengthMm={room.lengthMm}
        widthMm={room.widthMm}
        heightMm={room.heightMm}
        unit={unitLabels.m}
        label={fill(t.scheme, {
          length: meters(room.lengthMm),
          width: meters(room.widthMm),
          height: meters(room.heightMm),
        })}
        className="mx-auto mt-2 h-auto w-full max-w-[320px]"
      />

      <div className="mt-2 grid grid-cols-3 gap-2">
        {PARTS.map(([part, label]) => (
          <NumberField
            key={part}
            label={label}
            unit={unitLabels.m}
            value={room[part] / 1000}
            onValueChange={(value) => change(part, value)}
            min={LIMITS[part][0] / 1000}
            max={LIMITS[part][1] / 1000}
            messages={{
              range: fill(shell.form.range, {
                min: formatNumber(LIMITS[part][0] / 1000),
                max: formatNumber(LIMITS[part][1] / 1000),
                unit: unitLabels.m,
              }),
            }}
          />
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-surface-mint p-3">
        <dl className="grid grid-cols-3 gap-2">
          {(
            [
              [t.floor, surfaces.floorM2],
              [t.walls, surfaces.wallsM2],
              [t.ceiling, surfaces.ceilingM2],
            ] as const
          ).map(([label, m2]) => (
            <div key={label} className="flex min-w-0 flex-col">
              <dt className="text-small text-text-muted">{label}</dt>
              <dd className="m-0 text-body-strong tabular-nums">{areaText(m2)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex items-center justify-between gap-3 border-border border-t pt-2">
          <span className="min-w-0 text-small text-text-muted">
            {fill(t.openings, { list: openings || t.openingsNone })}
          </span>
          <RoomEditor
            open={editing}
            onOpenChange={(next) => {
              if (next) onEnsureRoom();
              setEditing(next);
            }}
            room={stored}
            newName={freeRoomName(rooms)}
            trigger={
              // A 40 px button in the summary; the tap area is 48 px all the same (`after:` widens it unseen).
              <button
                type="button"
                aria-label={fill(t.openingsLabel, { action })}
                className="relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md px-2 text-small font-semibold text-primary-hover transition-colors after:absolute after:-inset-1 hover:bg-primary-soft"
              >
                {openings ? (
                  <Pencil aria-hidden="true" className="size-4" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                {action}
              </button>
            }
          />
        </div>
      </div>

      <SuggestionsSheet
        saved={saved}
        open={open}
        onOpenChange={(next) => {
          if (next) onSubmit();
          setOpen(next);
        }}
        onAll={onAll}
        trigger={
          <Button variant="accent" size="lg" className="mt-5 w-full">
            {t.action}
            <ArrowRight aria-hidden="true" />
          </Button>
        }
      />
    </>
  );
}
