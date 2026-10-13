"use client";

import type { CutCorner, EstimateRoom, RoomType } from "@umnyaut/calc";
import { lengthUnitLabels, shell, tools, unitLabels } from "@umnyaut/catalog";
import { Button, NumberField, Segment, Select, UnitToggle } from "@umnyaut/ui";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import { DoorOpen, Plus, RectangleHorizontal, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { type RoomGeometry, useEstimateStore } from "@/entities/estimate";
import { centred, FloorPlan, type PlanOpening } from "@/entities/room";
import { fill } from "@/shared/lib";
import { CollapsibleCard, useOpenCards } from "@/shared/ui";
import {
  formOf,
  marksOf,
  nameForType,
  planOf,
  type RoomForm,
  recalcOf,
  roomOf,
  totalsOf,
  wallBoundOf,
} from "../model/editor";

const t = shell.roomEditor;
const o = shell.openings;
const p = shell.plan;
type Unit = "m" | "cm";
const SIZE = { min: 300, max: 100_000 };
const HEIGHT = { min: 1000, max: 10_000 };
const NONE = "none";

const toUnit = (mm: number, unit: Unit) => (unit === "m" ? mm / 1000 : mm / 10);
const fromUnit = (value: number, unit: Unit) => Math.round(unit === "m" ? value * 1000 : value * 10);
const cm = (mm: number) => `${formatNumber(mm / 10)}${NBSP}${lengthUnitLabels.cm}`;

export interface RoomEditorBodyProps {
  /** The room to edit; `null` — a new one. */
  room: EstimateRoom | null;
  /** What the calculator counts with: fills what the room does not know yet. */
  draft?: RoomGeometry;
  /** Name of a new room («Комната 3»). */
  newName: string;
  onDone(): void;
}

/**
 * The room editor (spec «Редактор комнаты»): name, type, shape and sizes, doors and windows with their wall and
 * offset, the plan with the room's numbers, what will be recounted. Loaded only when the editor opens.
 */
export default function RoomEditorBody({ room, draft, newName, onDone }: RoomEditorBodyProps) {
  const calcs = useEstimateStore((s) => s.estimate?.calcs) ?? [];
  const rooms = useEstimateStore((s) => s.estimate?.rooms);
  const others = (rooms ?? []).filter((r) => r.id !== room?.id).map((r) => r.name);
  const [form, setForm] = useState<RoomForm>(() => formOf(room, newName, draft));
  const [unit, setUnit] = useState<Unit>("m");
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const cards = useOpenCards();
  const nameId = useId();

  const patch = (next: Partial<RoomForm>) => setForm((f) => ({ ...f, ...next }));
  const flag = (name: string, bad: boolean) =>
    setInvalid((current) => {
      if (current.has(name) === bad) return current;
      const next = new Set(current);
      if (bad) next.add(name);
      else next.delete(name);
      return next;
    });

  const unitLabel = lengthUnitLabels[unit];
  const lengthField = (
    name: string,
    label: string,
    valueMm: number | undefined,
    limits: { min: number; max: number },
    onMm: (mm: number | undefined) => void,
    required = false,
  ) => (
    <NumberField
      key={`${name}-${unit}`}
      name={name}
      label={label}
      unit={unitLabel}
      value={valueMm === undefined ? null : toUnit(valueMm, unit)}
      min={toUnit(limits.min, unit)}
      max={toUnit(limits.max, unit)}
      required={required}
      messages={{
        range: fill(shell.form.range, {
          min: formatNumber(toUnit(limits.min, unit)),
          max: formatNumber(toUnit(limits.max, unit)),
          unit: unitLabel,
        }),
        required: shell.form.required,
      }}
      onValueChange={(v) => {
        if (v === null) {
          flag(name, required);
          if (!required) onMm(undefined);
          return;
        }
        const mm = fromUnit(v, unit);
        const bad = !(mm >= limits.min && mm <= limits.max);
        flag(name, bad);
        if (!bad) onMm(mm);
      }}
    />
  );

  const plan = planOf(form);
  const drawn = marksOf(form);
  const totals = totalsOf(form);
  const recalc = recalcOf(room, form, calcs, tools);
  const wallOptions = (drawn?.walls ?? []).map((_, i) => ({ value: String(i), label: fill(p.wall, { n: i + 1 }) }));
  const setOpening = (index: number, next: Partial<PlanOpening>) =>
    patch({ openings: form.openings.map((item, i) => (i === index ? { ...item, ...next } : item)) });

  const save = () => {
    useEstimateStore.getState().saveRoom(room?.id, roomOf(form), wallBoundOf(tools));
    onDone();
  };
  const remove = () => {
    if (!room) return;
    if (recalc.tools.length > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    useEstimateStore.getState().removeRoom(room.id);
    onDone();
  };

  return (
    <div className="flex flex-col gap-5 pt-1">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-small font-medium text-text">
          {t.name}
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="off"
          maxLength={40}
          value={form.name}
          placeholder={newName}
          onChange={(e) => patch({ name: e.target.value })}
          className="h-12 rounded-md border border-border-input bg-surface px-3 text-input text-text outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
        />
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset needs a visible legend; the label is above the chips */}
      <div role="group" aria-label={t.type} className="flex flex-col gap-1.5">
        <span className="text-small font-medium text-text">{t.type}</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(t.types) as RoomType[]).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={form.type === type}
              onClick={() => patch({ type, name: nameForType(type, form.name, newName, others) })}
              className="h-11 rounded-full border border-border px-4 text-small font-medium text-text aria-pressed:border-transparent aria-pressed:bg-primary-soft aria-pressed:font-semibold aria-pressed:text-primary-hover"
            >
              {t.types[type]}
            </button>
          ))}
        </div>
      </div>

      <section aria-label={t.sizes} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-body-strong text-text">{t.sizes}</h3>
          <UnitToggle value={unit} onValueChange={setUnit} labels={shell.form.unitLabels} label={shell.form.units} />
        </div>
        <Segment
          label={t.shape}
          options={[
            { value: "rect", label: t.shapes.rect },
            { value: "l", label: t.shapes.l },
          ]}
          value={form.shape}
          onValueChange={(shape) => patch({ shape })}
        />
        <div className="grid grid-cols-3 gap-2">
          {lengthField("lengthMm", t.length, form.lengthMm, SIZE, (lengthMm) => patch({ lengthMm }))}
          {lengthField("widthMm", t.width, form.widthMm, SIZE, (widthMm) => patch({ widthMm }))}
          {lengthField("heightMm", t.height, form.heightMm, HEIGHT, (heightMm) => patch({ heightMm }))}
        </div>
        {form.shape === "l" ? (
          <div className="grid grid-cols-2 gap-2">
            {lengthField(
              "cutLengthMm",
              t.cutLength,
              form.cutLengthMm,
              { min: 100, max: SIZE.max },
              (mm) => patch({ cutLengthMm: mm ?? 0 }),
              true,
            )}
            {lengthField(
              "cutWidthMm",
              t.cutWidth,
              form.cutWidthMm,
              { min: 100, max: SIZE.max },
              (mm) => patch({ cutWidthMm: mm ?? 0 }),
              true,
            )}
            <Select
              className="col-span-2"
              label={t.cutCorner}
              options={(Object.keys(t.corners) as CutCorner[]).map((c) => ({ value: c, label: t.corners[c] }))}
              value={form.cutCorner}
              onValueChange={(cutCorner) => patch({ cutCorner })}
            />
          </div>
        ) : null}
      </section>

      <section aria-label={t.plan} className="flex flex-col gap-3 rounded-lg bg-surface-sunken p-3">
        {plan && drawn ? (
          <FloorPlan
            outline={drawn.points}
            walls={drawn.walls}
            marks={drawn.marks}
            unit={unitLabels.m}
            label={fill(p.planLabel, {
              length: formatNumber(plan.lengthMm / 1000),
              width: formatNumber(plan.widthMm / 1000),
              unit: unitLabels.m,
            })}
            className="mx-auto max-h-56 w-full"
          />
        ) : (
          <p className="text-small text-text-muted">{t.needSizes}</p>
        )}
        {totals ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-small">
            {(
              [
                [t.floor, totals.floorM2, unitLabels.m2],
                [t.perimeter, totals.perimeterM, unitLabels.m],
                ...(totals.wallsM2 === undefined ? [] : [[t.walls, totals.wallsM2, unitLabels.m2] as const]),
                [t.ceiling, totals.ceilingM2, unitLabels.m2],
              ] as const
            ).map(([label, value, u]) => (
              <div key={label} className="flex justify-between gap-2">
                <dt className="text-text-muted">{label}</dt>
                <dd className="m-0 font-semibold tabular-nums">
                  {formatNumber(value)}
                  {NBSP}
                  {u}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      <section aria-label={t.openings} className="flex flex-col gap-3">
        <h3 className="text-body-strong text-text">{t.openings}</h3>
        {form.openings.length === 0 ? <p className="text-small text-text-muted">{o.empty}</p> : null}
        <ul className="flex flex-col gap-3">
          {form.openings.map((item, index) => {
            const name = item.type === "door" ? o.door : o.window;
            const wall = item.place ? drawn?.walls[item.place.wall] : undefined;
            const maxOffset = Math.max((wall?.lengthMm ?? 0) - item.widthMm, 0);
            const size = `${formatNumber(toUnit(item.widthMm, unit))} × ${formatNumber(toUnit(item.heightMm, unit))}${NBSP}${unitLabel}`;
            const place =
              item.place && wall
                ? fill(p.placedAt, { wall: fill(p.wall, { n: item.place.wall + 1 }), offset: cm(item.place.offsetMm) })
                : p.unplaced;
            const openingSize = (part: "widthMm" | "heightMm", label: string) =>
              lengthField(
                `openings.${index}.${part}`,
                label,
                item[part],
                { min: o.limits.minMm, max: o.limits.maxMm },
                (mm) => mm !== undefined && setOpening(index, { [part]: mm }),
                true,
              );
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: openings have no id; order is stable while editing
              <li key={index}>
                <CollapsibleCard
                  icon={item.type === "door" ? DoorOpen : RectangleHorizontal}
                  title={name}
                  summary={fill(t.openingAt, { size, place })}
                  open={cards.isOpen(index)}
                  onOpenChange={(next) => cards.setOpen(index, next)}
                  removeLabel={`${o.remove}: ${name}`}
                  onRemove={() => {
                    cards.removed(index);
                    setInvalid((current) => new Set([...current].filter((n) => !n.startsWith("openings."))));
                    patch({ openings: form.openings.filter((_, i) => i !== index) });
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {openingSize("widthMm", o.width)}
                    {openingSize("heightMm", o.height)}
                    {drawn ? (
                      <Select
                        label={p.wallLabel}
                        options={
                          item.place && wall ? wallOptions : [{ value: NONE, label: p.unplaced }, ...wallOptions]
                        }
                        value={item.place && wall ? String(item.place.wall) : NONE}
                        onValueChange={(v) => {
                          if (v === NONE) return;
                          const length = drawn.walls[Number(v)]?.lengthMm ?? 0;
                          const offsetMm = Math.min(item.place?.offsetMm ?? 0, Math.max(length - item.widthMm, 0));
                          setOpening(index, { place: { ...item.place, wall: Number(v), offsetMm } });
                        }}
                      />
                    ) : null}
                    {drawn && item.place && wall ? (
                      <NumberField
                        label={p.offset}
                        hint={p.offsetHint}
                        unit={lengthUnitLabels.cm}
                        value={item.place.offsetMm / 10}
                        min={0}
                        max={maxOffset / 10}
                        required
                        messages={{
                          range: fill(shell.form.range, {
                            min: 0,
                            max: formatNumber(maxOffset / 10),
                            unit: lengthUnitLabels.cm,
                          }),
                          required: shell.form.required,
                        }}
                        onValueChange={(v) => {
                          const mm = v === null ? Number.NaN : Math.round(v * 10);
                          if (item.place && mm >= 0 && mm <= maxOffset)
                            setOpening(index, { place: { ...item.place, offsetMm: mm } });
                        }}
                      />
                    ) : null}
                  </div>
                </CollapsibleCard>
              </li>
            );
          })}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          {(["door", "window"] as const).map((type) => (
            <Button
              key={type}
              variant="secondary"
              disabled={form.openings.length >= o.limits.rows}
              onClick={() => {
                cards.setOpen(form.openings.length, true);
                const opening = { type, ...o.defaults[type] };
                patch({ openings: [...form.openings, plan ? centred(plan, opening) : opening] });
              }}
            >
              <Plus aria-hidden="true" />
              {type === "door" ? o.addDoor : o.addWindow}
            </Button>
          ))}
        </div>
      </section>

      {recalc.tools.length > 0 ? (
        <div className="flex flex-col gap-1 text-small text-text-muted" data-room-recalc>
          <p>{fill(t.recalc, { tools: recalc.tools.join(", ") })}</p>
          {recalc.resets.map((r) => (
            <p key={r.tool}>{fill(t.reset, r)}</p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        {confirming ? (
          <p role="alert" className="text-small text-danger">
            {fill(t.removeConfirm, { tools: recalc.tools.join(", ") })}
          </p>
        ) : null}
        <div className="flex gap-2">
          {room ? (
            <Button
              variant={confirming ? "danger" : "secondary"}
              size="icon"
              className={confirming ? "size-14 rounded-lg" : "size-14 rounded-lg text-danger"}
              aria-label={confirming ? t.removeYes : t.remove}
              onClick={remove}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          ) : null}
          <Button variant="secondary" size="lg" className="shrink-0 px-4 sm:flex-1" onClick={onDone}>
            {t.cancel}
          </Button>
          <Button
            variant="accent"
            size="lg"
            className="min-w-0 flex-1 px-4 sm:flex-[2]"
            disabled={invalid.size > 0}
            onClick={save}
          >
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
