"use client";

import { type BareZone, type Opening, placeOpenings, WINDOW_SILL_MM } from "@umnyaut/calc";
import { lengthUnitLabels, shell } from "@umnyaut/catalog";
import { Button, NumberField, ResponsiveSheet, Select } from "@umnyaut/ui";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import { DoorOpen, Plus, RectangleHorizontal, SquareDashed } from "lucide-react";
import { type ReactNode, useState } from "react";
import { centred, collapse, expand, FloorPlan, type PlanOpening, type PlanRoom, planOutline } from "@/entities/room";
import { fill } from "@/shared/lib";
import { CollapsibleCard, useOpenCards } from "@/shared/ui";

const t = shell.plan;
const o = shell.openings;
const NONE = "none";

export interface PlanEditorProps {
  room: PlanRoom;
  openings: readonly Opening[];
  onChange(next: readonly Opening[]): void;
  /** One element; opens the editor. */
  trigger: ReactNode;
  /** Windows also get their height from the floor (wall tiling, wallpaper). */
  sills?: boolean;
  /** Wallpaper: bare zones on the walls and «nothing under the window». */
  zones?: readonly BareZone[];
  onZonesChange?(next: readonly BareZone[]): void;
}

/** Largest zone size the fields accept, cm. */
const ZONE_MAX_CM = 1000;

/** Highest sill the field accepts, cm. */
const SILL_MAX_CM = 300;

/**
 * Plan editor (docs/ui/room-plan-and-layout-guides.md): the room from above with numbered walls, and per door or
 * window the wall it is on and how far from the wall's left corner (looking at the wall from the room).
 * Bottom sheet on the phone, dialog from 1024 px. Counts and sizes stay as they are; only places change.
 */
export function PlanEditor({
  room,
  openings,
  onChange,
  trigger,
  sills = false,
  zones,
  onZonesChange,
}: PlanEditorProps) {
  const [open, setOpen] = useState(false);
  const { points, walls } = planOutline(room);
  const list = expand(openings);
  const { placed } = placeOpenings(walls, openings);
  const set = (next: PlanOpening[]) => onChange(collapse(next));
  const cards = useOpenCards();
  const zoneCards = useOpenCards();
  const setZone = (index: number, patch: Partial<BareZone>) =>
    onZonesChange?.((zones ?? []).map((z, i) => (i === index ? { ...z, ...patch } : z)));
  const cmField = (label: string, valueMm: number, maxCm: number, onMm: (mm: number) => void, hint?: string) => (
    <NumberField
      label={label}
      {...(hint ? { hint } : {})}
      unit={cm}
      value={valueMm / 10}
      min={0}
      max={maxCm}
      required
      messages={{
        range: fill(shell.form.range, { min: 0, max: formatNumber(maxCm), unit: cm }),
        required: shell.form.required,
      }}
      onValueChange={(v) => {
        const mm = v === null ? Number.NaN : Math.round(v * 10);
        if (mm >= 0 && mm <= maxCm * 10) onMm(mm);
      }}
    />
  );
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
            const sill =
              sills && item.type === "window" && item.place ? (item.place.sillMm ?? WINDOW_SILL_MM) : undefined;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: openings have no id; order is stable while editing
              <li key={index}>
                <CollapsibleCard
                  icon={item.type === "door" ? DoorOpen : RectangleHorizontal}
                  title={`${name} · ${formatNumber(item.widthMm / 10)}${NBSP}${cm}`}
                  summary={
                    item.place
                      ? [
                          fill(t.placedAt, {
                            wall: fill(t.wall, { n: item.place.wall + 1 }),
                            offset: `${formatNumber(item.place.offsetMm / 10)}${NBSP}${cm}`,
                          }),
                          ...(sill === undefined
                            ? []
                            : [fill(t.sillAt, { sill: `${formatNumber(sill / 10)}${NBSP}${cm}` })]),
                          ...(zones && item.place?.bareBelow ? [t.bareBelowAt] : []),
                        ].join(" · ")
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
                        update(index, { place: { ...item.place, wall: Number(v), offsetMm } });
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
                    {sill !== undefined && item.place ? (
                      <NumberField
                        label={t.sill}
                        hint={t.sillHint}
                        unit={cm}
                        value={sill / 10}
                        min={0}
                        max={SILL_MAX_CM}
                        required
                        messages={{
                          range: fill(shell.form.range, { min: 0, max: SILL_MAX_CM, unit: cm }),
                          required: shell.form.required,
                        }}
                        onValueChange={(v) => {
                          const mm = v === null ? Number.NaN : Math.round(v * 10);
                          if (item.place && mm >= 0 && mm <= SILL_MAX_CM * 10)
                            update(index, { place: { ...item.place, sillMm: mm } });
                        }}
                      />
                    ) : null}
                    {zones && item.type === "window" && item.place ? (
                      <label className="col-span-2 flex min-h-12 items-center gap-3 text-body text-text">
                        <input
                          type="checkbox"
                          className="size-5 accent-[var(--color-primary)]"
                          checked={item.place.bareBelow === true}
                          onChange={(e) => {
                            if (!item.place) return;
                            const { bareBelow: _, ...rest } = item.place;
                            update(index, { place: e.target.checked ? { ...rest, bareBelow: true } : rest });
                          }}
                        />
                        {t.bareBelow}
                      </label>
                    ) : null}
                  </div>
                </CollapsibleCard>
              </li>
            );
          })}
        </ul>
        {zones && onZonesChange ? (
          <section aria-label={t.zones} className="flex flex-col gap-2">
            <h3 className="text-body-strong text-text">{t.zones}</h3>
            <p className="text-small text-text-muted">{t.zonesHint}</p>
            <ul className="flex flex-col gap-3">
              {zones.map((zone, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: zones have no id; order is stable while editing
                <li key={index}>
                  <CollapsibleCard
                    icon={SquareDashed}
                    title={t.zone}
                    summary={fill(t.zoneAt, {
                      wall: fill(t.wall, { n: zone.wall + 1 }),
                      offset: `${formatNumber(zone.offsetMm / 10)}${NBSP}${cm}`,
                      width: formatNumber(zone.widthMm / 10),
                      height: `${formatNumber(zone.heightMm / 10)}${NBSP}${cm}`,
                    })}
                    open={zoneCards.isOpen(index)}
                    onOpenChange={(next) => zoneCards.setOpen(index, next)}
                    removeLabel={t.removeZone}
                    onRemove={() => {
                      zoneCards.removed(index);
                      onZonesChange(zones.filter((_, i) => i !== index));
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label={t.wallLabel}
                        options={wallOptions}
                        value={String(zone.wall)}
                        onValueChange={(v) => setZone(index, { wall: Number(v) })}
                      />
                      {cmField(
                        t.offset,
                        zone.offsetMm,
                        ZONE_MAX_CM,
                        (mm) => setZone(index, { offsetMm: mm }),
                        t.offsetHint,
                      )}
                      {cmField(t.zoneWidth, zone.widthMm, ZONE_MAX_CM, (mm) =>
                        setZone(index, { widthMm: Math.max(mm, 10) }),
                      )}
                      {cmField(t.zoneHeight, zone.heightMm, ZONE_MAX_CM, (mm) =>
                        setZone(index, { heightMm: Math.max(mm, 10) }),
                      )}
                      {cmField(t.zoneFromFloor, zone.fromFloorMm, ZONE_MAX_CM, (mm) =>
                        setZone(index, { fromFloorMm: mm }),
                      )}
                    </div>
                  </CollapsibleCard>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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
          {zones && onZonesChange ? (
            <Button
              variant="secondary"
              disabled={zones.length >= o.limits.rows}
              onClick={() => {
                zoneCards.setOpen(zones.length, true);
                onZonesChange([...zones, { wall: 0, offsetMm: 0, fromFloorMm: 0, widthMm: 1000, heightMm: 1000 }]);
              }}
            >
              <Plus aria-hidden="true" />
              {t.addZone}
            </Button>
          ) : null}
          <Button className="ml-auto" onClick={() => setOpen(false)}>
            {t.done}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
