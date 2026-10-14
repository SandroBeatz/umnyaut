"use client";

import type { Opening } from "@umnyaut/calc";
import { type FieldDef, getCountry, lengthUnitLabels, shell, type ToolDef } from "@umnyaut/catalog";
import { Button, NumberField, PresetChips, Segment, Select } from "@umnyaut/ui";
import { formatMoney, formatNumber } from "@umnyaut/ui/format";
import { ChevronDown, PencilRuler, Ruler } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { useCountry } from "@/entities/country";
import { useActiveRoom } from "@/entities/estimate";
import type { ToolValues } from "@/entities/tool";
import { PlanEditor } from "@/features/edit-room-plan";
import { fill } from "@/shared/lib";
import {
  changedHidden,
  formSections,
  fromDisplay,
  type LengthUnit,
  matchingPreset,
  roomBindings,
  shapeAsDropdown,
  toDisplay,
} from "../model/fields";
import { planRoomOf } from "../model/plan";
import { OpeningsField } from "./OpeningsField";
import { TextField } from "./TextField";

export interface ToolFormProps {
  tool: ToolDef;
  values: ToolValues;
  defaults: ToolValues;
  onChange(patch: ToolValues): void;
  onInvalid(name: string, invalid: boolean): void;
  /** Last of «Ещё параметры»: the calc's «Метка». */
  extra?: ReactNode;
  /** м or см for room-sized lengths; chosen in the form's heading row (`FormHeading`). */
  unit: LengthUnit;
}

const f = shell.form;
const checkedFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Form from `FieldDef[]` (design spec §11–12): main fields two per row with the room shape right under the room
 * size, preset chips, then «Ещё параметры · N» with the m/cm switch. From 1024 px everything is open.
 */
export function ToolForm({ tool, values, defaults, onChange, onInvalid, extra, unit }: ToolFormProps) {
  const [open, setOpen] = useState(false);
  const moreId = useId();
  const room = useActiveRoom();
  const country = useCountry();
  const config = getCountry(country);
  const sign = config.sign;
  /** «Обычно около 1 300 ₽, проверено 12 ноября 2026 г.» when the country has a typical price for the item. */
  const typicalHint = (item: string) => {
    const price = config.typicalPrices[item];
    if (price === undefined || !config.pricesCheckedAt) return undefined;
    return fill(f.typicalPrice, {
      price: formatMoney(price, country),
      date: checkedFormat.format(new Date(`${config.pricesCheckedAt}T00:00:00Z`)),
    });
  };
  const bound = new Map(roomBindings(tool.fields));
  // The room's fields (sizes, shape, doors and windows) live in the room row and the room editor (spec
  // «Калькулятор»); the form keeps what is about the material.
  const fields = tool.fields.filter((field) => !("name" in field && bound.has(field.name)));

  const { main, more } = formSections(fields, values);
  const shapeDropdown = shapeAsDropdown(main);
  const changed = changedHidden(fields, values, defaults);
  const hasMore = more.length > 0 || Boolean(extra);

  const label = (field: FieldDef & { name: string }): ReactNode => {
    const key = bound.get(field.name);
    return key && room?.[key] !== undefined ? (
      <span className="inline-flex items-center gap-1.5">
        {field.label}
        <Ruler role="img" aria-label={f.fromRoom} className="size-4 text-primary-hover" />
      </span>
    ) : (
      field.label
    );
  };

  const renderField = (field: FieldDef): ReactNode => {
    switch (field.kind) {
      case "length": {
        const shown = field.unit === "m" ? unit : field.unit;
        const range = fill(f.range, {
          min: formatNumber(toDisplay(field.min, shown)),
          max: formatNumber(toDisplay(field.max, shown)),
          unit: lengthUnitLabels[shown],
        });
        return (
          <NumberField
            key={field.name}
            name={field.name}
            label={label(field)}
            hint={field.hint}
            unit={lengthUnitLabels[shown]}
            value={toDisplay(values[field.name] as number, shown)}
            min={toDisplay(field.min, shown)}
            max={toDisplay(field.max, shown)}
            required
            messages={{ range, required: f.required }}
            onValueChange={(v) => {
              const mm = v === null ? Number.NaN : fromDisplay(v, shown);
              const bad = !(mm >= field.min && mm <= field.max);
              onInvalid(field.name, bad);
              if (!bad) onChange({ [field.name]: mm });
            }}
          />
        );
      }
      case "number":
      case "price": {
        const isPrice = field.kind === "price";
        const min = isPrice ? 0 : field.min;
        const max = isPrice ? 10_000_000 : field.max;
        const value = values[field.name];
        return (
          <NumberField
            key={field.name}
            name={field.name}
            label={label(field)}
            hint={isPrice ? (typicalHint(field.item) ?? field.hint) : field.hint}
            unit={isPrice ? sign : field.unit}
            value={typeof value === "number" ? value : null}
            min={min}
            max={max}
            required={!isPrice}
            messages={{
              range: fill(f.range, {
                min: formatNumber(min),
                max: formatNumber(max),
                unit: isPrice ? "" : (field.unit ?? ""),
              }),
              required: f.required,
            }}
            onValueChange={(v) => {
              const bad = v === null ? !isPrice : !(v >= min && v <= max);
              onInvalid(field.name, bad);
              if (!bad) onChange({ [field.name]: v ?? undefined });
            }}
          />
        );
      }
      case "select": {
        // A wall picker lists the walls of the room's plan: four, six for an L-shape.
        const options = field.walls
          ? [
              ...field.options,
              ...Array.from({ length: values.shape === "l" ? 6 : 4 }, (_, k) => ({
                value: String(k + 1),
                label: fill(f.wall, { n: k + 1 }),
              })),
            ]
          : field.options;
        // Options are strings; a numeric input (linoleum roll width) gets its number back.
        // An option may set other fields with it: a wallpaper type fills the paste coverage of its kind.
        const pick = (v: string) =>
          onChange({
            [field.name]: typeof values[field.name] === "number" ? Number(v) : v,
            ...field.options.find((o) => o.value === v)?.fills,
          });
        if (field.room === "shape" && !shapeDropdown) {
          // Under the room size the options speak for themselves; the group keeps its name for screen readers.
          return (
            <Segment
              key={field.name}
              className="col-span-2"
              label={field.label}
              options={options}
              value={String(values[field.name])}
              onValueChange={pick}
            />
          );
        }
        return options.length <= 4 && !field.dropdown && field.room !== "shape" ? (
          <div key={field.name} className="col-span-2 flex flex-col gap-1.5">
            <span className="text-small font-medium text-text">{label(field)}</span>
            <Segment label={field.label} options={options} value={String(values[field.name])} onValueChange={pick} />
          </div>
        ) : (
          <div key={field.name} className="flex flex-col gap-1.5">
            <Select label={label(field)} options={options} value={String(values[field.name])} onValueChange={pick} />
            {field.hint ? <p className="text-small text-text-muted">{field.hint}</p> : null}
          </div>
        );
      }
      case "toggle":
        return (
          <label key={field.name} className="flex min-h-12 items-center gap-3 col-span-2 text-body text-text">
            <input
              type="checkbox"
              className="size-5 accent-[var(--color-primary)]"
              checked={values[field.name] === true}
              onChange={(e) => onChange({ [field.name]: e.target.checked })}
            />
            {field.label}
          </label>
        );
      case "text":
        return (
          <TextField
            key={field.name}
            name={field.name}
            label={label(field)}
            hint={field.hint}
            maxLength={field.maxLength}
            value={typeof values[field.name] === "string" ? (values[field.name] as string) : ""}
            onChange={(text) => onChange({ [field.name]: text })}
          />
        );
      case "openings":
        return (
          <OpeningsField
            key={field.name}
            label={field.label}
            unit={unit}
            value={values[field.name] as readonly Opening[]}
            onChange={(next) => onChange({ [field.name]: next })}
            onInvalid={onInvalid}
          />
        );
      case "plan": {
        const openings = (values[field.name] as readonly Opening[] | undefined) ?? [];
        const total = openings.reduce((sum, o) => sum + o.count, 0);
        const placed = openings.reduce((sum, o) => sum + Math.min(o.places?.length ?? 0, o.count), 0);
        return (
          <div key={field.name} className="col-span-2 flex flex-col gap-1.5">
            <span className="text-small font-medium text-text">{label(field)}</span>
            <div className="flex flex-wrap items-center gap-3">
              <PlanEditor
                room={planRoomOf(values)}
                openings={openings}
                onChange={(next) => onChange({ [field.name]: next })}
                trigger={
                  <Button variant="secondary">
                    <PencilRuler aria-hidden="true" />
                    {placed > 0 ? shell.plan.edit : shell.plan.open}
                  </Button>
                }
              />
              <span className="text-small text-text-muted">{fill(shell.plan.summary, { placed, total })}</span>
            </div>
            {field.hint ? <span className="text-small text-text-muted">{field.hint}</span> : null}
          </div>
        );
      }
      case "preset": {
        const presets = tool.presets ?? [];
        return (
          <div key={`preset-${field.label}`} className="col-span-2 flex flex-col gap-1.5">
            <span className="text-small font-medium text-text">{field.label}</span>
            <PresetChips
              label={field.label}
              chips={presets.filter((p) => field.presets.includes(p.id)).map((p) => ({ value: p.id, label: p.label }))}
              value={matchingPreset(presets, field.presets, values) ?? null}
              onValueChange={(id) => {
                const preset = presets.find((p) => p.id === id);
                if (preset) onChange(preset.values);
              }}
            />
          </div>
        );
      }
    }
  };

  const render = (field: FieldDef): ReactNode =>
    "wide" in field && field.wide ? (
      <div key={`wide-${field.name}`} className="col-span-2">
        {renderField(field)}
      </div>
    ) : (
      renderField(field)
    );

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">{main.map(render)}</div>
      {hasMore ? (
        <div className="flex min-h-12 items-center lg:hidden">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={moreId}
            onClick={() => setOpen(!open)}
            className="inline-flex min-h-12 items-center gap-1.5 text-body-strong text-primary hover:text-primary-hover"
          >
            {open ? f.less : changed > 0 ? `${f.more} · ${changed}` : f.more}
            <ChevronDown aria-hidden="true" className={open ? "size-5 rotate-180" : "size-5"} />
          </button>
        </div>
      ) : null}
      {hasMore ? (
        <div
          id={moreId}
          className={open ? "grid grid-cols-2 gap-x-3 gap-y-4" : "hidden grid-cols-2 gap-x-3 gap-y-4 lg:grid"}
        >
          {more.filter((field) => !("group" in field && field.group)).map(render)}
          {(tool.groups ?? []).map((group) => {
            const inGroup = more.filter(
              (field) =>
                "group" in field && field.group === group.id && !("name" in field && field.name === group.toggle),
            );
            const on = group.toggle ? values[group.toggle] === true : true;
            if (!group.toggle && inGroup.length === 0) return null;
            // A block per material: its heading (or the toggle that switches it on), then its fields.
            return (
              <fieldset
                key={group.id}
                className="col-span-2 grid grid-cols-2 gap-x-3 gap-y-4 border-border border-t pt-3"
                data-field-group={group.id}
              >
                <legend className="float-left col-span-2">
                  {group.toggle ? (
                    <label className="flex min-h-12 items-center gap-3 text-body-strong text-text">
                      <input
                        type="checkbox"
                        className="size-5 accent-[var(--color-primary)]"
                        checked={on}
                        onChange={(e) => onChange({ [group.toggle as string]: e.target.checked })}
                      />
                      {group.title}
                    </label>
                  ) : (
                    <span className="text-body-strong text-text">{group.title}</span>
                  )}
                </legend>
                {on ? inGroup.map(render) : null}
              </fieldset>
            );
          })}
          {extra ? <div className="col-span-2">{extra}</div> : null}
        </div>
      ) : null}
    </form>
  );
}
