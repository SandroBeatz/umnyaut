"use client";

import { type Opening, placeOpenings } from "@umnyaut/calc";
import { lengthUnitLabels, shell } from "@umnyaut/catalog";
import { Button, NumberField, ResponsiveSheet, Select } from "@umnyaut/ui";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import { DoorOpen, Plus, RectangleHorizontal } from "lucide-react";
import { type ReactNode, useState } from "react";
import { FloorPlan } from "@/entities/room";
import { fill } from "@/shared/lib";
import { CollapsibleCard, useOpenCards } from "@/shared/ui";
import { centred, collapse, expand, type PlanOpening, type PlanRoom, planOutline } from "../model/plan";

const t = shell.plan;
const o = shell.openings;
const NONE = "none";

export interface PlanEditorProps {
  room: PlanRoom;
  openings: readonly Opening[];
  onChange(next: readonly Opening[]): void;
  /** One element; opens the editor. */
  trigger: ReactNode;
}

/**
 * Plan editor (docs/ui/room-plan-and-layout-guides.md): the room from above with numbered walls, and per door or
 * window the wall it is on and how far from the wall's left corner (looking at the wall from the room).
 * Bottom sheet on the phone, dialog from 1024 px. Counts and sizes stay as they are; only places change.
 */
export function PlanEditor({ room, openings, onChange, trigger }: PlanEditorProps) {
  const [open, setOpen] = useState(false);
  const { points, walls } = planOutline(room);
  const list = expand(openings);
  const { placed } = placeOpenings(walls, openings);
  const set = (next: PlanOpening[]) => onChange(collapse(next));
  const cards = useOpenCards();
  const update = (index: number, patch: Partial<PlanOpening>) =>
    set(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const wallOptions = walls.map((_, i) => ({ value: String(i), label: fill(t.wall, { n: i + 1 }) }));
  const cm = lengthUnitLabels.cm;

  return (
    <ResponsiveSheet
      trigger={trigger}
      title={t.title}
      description={t.description}
      closeLabel={shell.close}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="flex flex-col gap-4">
        <FloorPlan
          outline={points}
          walls={walls}
          marks={placed.map((p) => p.mark)}
          unit={lengthUnitLabels.m}
          label={fill(t.planLabel, {
            length: formatNumber(room.lengthMm / 1000),
            width: formatNumber(room.widthMm / 1000),
            unit: lengthUnitLabels.m,
          })}
          className="mx-auto max-h-72 w-full"
        />
        {list.length === 0 ? <p className="text-small text-text-muted">{t.none}</p> : null}
        <ul className="flex flex-col gap-3">
          {list.map((item, index) => {
            const name = item.type === "door" ? o.door : o.window;
            const wall = item.place ? walls[item.place.wall] : undefined;
            const maxMm = Math.max((wall?.lengthMm ?? 0) - item.widthMm, 0);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: openings have no id; order is stable while editing
              <li key={index}>
                <CollapsibleCard
                  icon={item.type === "door" ? DoorOpen : RectangleHorizontal}
                  title={`${name} · ${formatNumber(item.widthMm / 10)}${NBSP}${cm}`}
                  summary={
                    item.place
                      ? fill(t.placedAt, {
                          wall: fill(t.wall, { n: item.place.wall + 1 }),
                          offset: `${formatNumber(item.place.offsetMm / 10)}${NBSP}${cm}`,
                        })
                      : t.unplaced
                  }
                  open={cards.isOpen(index)}
                  onOpenChange={(next) => cards.setOpen(index, next)}
                  removeLabel={`${o.remove}: ${name}`}
                  onRemove={() => {
                    cards.removed(index);
                    set(list.filter((_, i) => i !== index));
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label={t.wallLabel}
                      options={item.place ? wallOptions : [{ value: NONE, label: t.unplaced }, ...wallOptions]}
                      value={item.place ? String(item.place.wall) : NONE}
                      onValueChange={(v) => {
                        if (v === NONE) return;
                        const length = walls[Number(v)]?.lengthMm ?? 0;
                        const offsetMm = Math.min(item.place?.offsetMm ?? 0, Math.max(length - item.widthMm, 0));
                        update(index, { place: { wall: Number(v), offsetMm } });
                      }}
                    />
                    {item.place ? (
                      <NumberField
                        label={t.offset}
                        hint={t.offsetHint}
                        unit={cm}
                        value={item.place.offsetMm / 10}
                        min={0}
                        max={maxMm / 10}
                        required
                        messages={{
                          range: fill(shell.form.range, { min: 0, max: formatNumber(maxMm / 10), unit: cm }),
                          required: shell.form.required,
                        }}
                        onValueChange={(v) => {
                          const mm = v === null ? Number.NaN : Math.round(v * 10);
                          if (item.place && mm >= 0 && mm <= maxMm)
                            update(index, { place: { ...item.place, offsetMm: mm } });
                        }}
                      />
                    ) : null}
                  </div>
                </CollapsibleCard>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-2">
          {(["door", "window"] as const).map((type) => (
            <Button
              key={type}
              variant="secondary"
              disabled={list.length >= o.limits.rows}
              onClick={() => {
                cards.setOpen(list.length, true);
                set([...list, centred(room, { type, ...o.defaults[type] })]);
              }}
            >
              <Plus aria-hidden="true" />
              {type === "door" ? o.addDoor : o.addWindow}
            </Button>
          ))}
          <Button className="ml-auto" onClick={() => setOpen(false)}>
            {t.done}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
