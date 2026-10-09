"use client";

import type { Opening } from "@umnyaut/calc";
import { countries, type FieldDef, lengthUnitLabels, shell, type ToolDef } from "@umnyaut/catalog";
import { NumberField, PresetChips, Segment, Select, UnitToggle } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { ChevronDown, Ruler } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { useCountry } from "@/entities/country";
import { useRoomStore } from "@/entities/room";
import type { ToolValues } from "@/entities/tool";
import { fill } from "@/shared/lib";
import {
  changedHidden,
  fromDisplay,
  isVisible,
  type LengthUnit,
  matchingPreset,
  roomBindings,
  toDisplay,
} from "../model/fields";
import { OpeningsField } from "./OpeningsField";

export interface ToolFormProps {
  tool: ToolDef;
  values: ToolValues;
  defaults: ToolValues;
  onChange(patch: ToolValues): void;
  onInvalid(name: string, invalid: boolean): void;
}

const f = shell.form;

/**
 * Form from `FieldDef[]` (design spec §11–12): main fields two per row, preset chips, then «Ещё параметры · N»
 * with the m/cm switch. From 1024 px everything is open.
 */
export function ToolForm({ tool, values, defaults, onChange, onInvalid }: ToolFormProps) {
  const [unit, setUnit] = useState<LengthUnit>("m");
  const [open, setOpen] = useState(false);
  const moreId = useId();
  const room = useRoomStore((s) => s.room);
  const country = useCountry();
  const sign = countries.find((c) => c.code === country)?.sign;
  const bound = new Map(roomBindings(tool.fields));

  const visible = tool.fields.filter((field) => isVisible(field, values));
  const main = visible.filter((field) => field.main);
  const more = visible.filter((field) => !field.main);
  const changed = changedHidden(tool.fields, values, defaults);
  const hasLengths = tool.fields.some((field) => field.kind === "length" || field.kind === "openings");

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

  const render = (field: FieldDef): ReactNode => {
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
            hint={field.hint}
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
      case "select":
        return field.options.length <= 4 && !field.dropdown ? (
          <div key={field.name} className="col-span-2 flex flex-col gap-1.5">
            <span className="text-small font-medium text-text">{label(field)}</span>
            <Segment
              label={field.label}
              options={field.options}
              value={String(values[field.name])}
              onValueChange={(v) => onChange({ [field.name]: v })}
            />
          </div>
        ) : (
          <Select
            key={field.name}
            label={label(field)}
            options={field.options}
            value={String(values[field.name])}
            onValueChange={(v) => onChange({ [field.name]: v })}
          />
        );
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
      case "preset": {
        const presets = tool.presets ?? [];
        return (
          <PresetChips
            key={`preset-${field.label}`}
            label={field.label}
            className="col-span-2"
            chips={presets.filter((p) => field.presets.includes(p.id)).map((p) => ({ value: p.id, label: p.label }))}
            value={matchingPreset(presets, field.presets, values) ?? null}
            onValueChange={(id) => {
              const preset = presets.find((p) => p.id === id);
              if (preset) onChange(preset.values);
            }}
          />
        );
      }
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">{main.map(render)}</div>
      {more.length > 0 || hasLengths ? (
        <div className="flex min-h-12 items-center justify-between gap-3">
          {more.length > 0 ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={moreId}
              onClick={() => setOpen(!open)}
              className="inline-flex min-h-12 items-center gap-1.5 text-body-strong text-primary hover:text-primary-hover lg:hidden"
            >
              {open ? f.less : changed > 0 ? `${f.more} · ${changed}` : f.more}
              <ChevronDown aria-hidden="true" className={open ? "size-5 rotate-180" : "size-5"} />
            </button>
          ) : (
            <span />
          )}
          {hasLengths ? (
            <UnitToggle label={f.units} labels={f.unitLabels} value={unit} onValueChange={setUnit} />
          ) : null}
        </div>
      ) : null}
      {more.length > 0 ? (
        <div
          id={moreId}
          className={open ? "grid grid-cols-2 gap-x-3 gap-y-4" : "hidden grid-cols-2 gap-x-3 gap-y-4 lg:grid"}
        >
          {more.map(render)}
        </div>
      ) : null}
    </form>
  );
}
