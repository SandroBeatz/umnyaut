"use client";

import type { Opening } from "@umnyaut/calc";
import { lengthUnitLabels, shell } from "@umnyaut/catalog";
import { Button, NumberField, Stepper } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { DoorOpen, Plus, RectangleHorizontal, X } from "lucide-react";
import { fill } from "@/shared/lib";
import { fromDisplay, type LengthUnit, toDisplay } from "../model/fields";

const t = shell.openings;
const { minMm, maxMm, rows } = t.limits;

export interface OpeningsFieldProps {
  label: string;
  value: readonly Opening[];
  unit: LengthUnit;
  onChange(next: readonly Opening[]): void;
  onInvalid(name: string, invalid: boolean): void;
}

/** Windows and doors: one card per size with a count; «+ Дверь», «+ Окно» insert typical sizes. */
export function OpeningsField({ label, value, unit, onChange, onInvalid }: OpeningsFieldProps) {
  const range = fill(shell.form.range, {
    min: formatNumber(toDisplay(minMm, unit)),
    max: formatNumber(toDisplay(maxMm, unit)),
    unit: lengthUnitLabels[unit],
  });
  const update = (index: number, patch: Partial<Opening>) =>
    onChange(value.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  const add = (type: Opening["type"]) => onChange([...value, { type, ...t.defaults[type], count: 1 }]);

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 col-span-2 border-0 p-0">
      <legend className="mb-1.5 text-small font-medium text-text">{label}</legend>
      {value.length === 0 ? <p className="text-small text-text-muted">{t.empty}</p> : null}
      {value.map((opening, index) => {
        const Icon = opening.type === "door" ? DoorOpen : RectangleHorizontal;
        const size = (part: "widthMm" | "heightMm", partLabel: string) => (
          <NumberField
            label={partLabel}
            unit={lengthUnitLabels[unit]}
            value={toDisplay(opening[part], unit)}
            min={toDisplay(minMm, unit)}
            max={toDisplay(maxMm, unit)}
            messages={{ range, required: shell.form.required }}
            required
            onValueChange={(v) => {
              const mm = v === null ? Number.NaN : fromDisplay(v, unit);
              const bad = !(mm >= minMm && mm <= maxMm);
              onInvalid(`openings.${index}.${part}`, bad);
              if (!bad) update(index, { [part]: mm });
            }}
          />
        );
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows have no id; order is stable while editing
          <div key={index} className="rounded-md border border-border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Icon aria-hidden="true" className="size-5 text-primary-hover" />
              <span className="flex-1 text-body-strong">{opening.type === "door" ? t.door : t.window}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${t.remove}: ${opening.type === "door" ? t.door : t.window}`}
                onClick={() => {
                  // Rows shift after a removal, so every row's error flag is reset.
                  onInvalid("openings.*", false);
                  onChange(value.filter((_, i) => i !== index));
                }}
              >
                <X />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {size("widthMm", t.width)}
              {size("heightMm", t.height)}
            </div>
            <Stepper
              className="mt-3"
              label={t.count}
              value={opening.count}
              min={0}
              max={50}
              decrementLabel={shell.form.decrement}
              incrementLabel={shell.form.increment}
              onValueChange={(count) => update(index, { count })}
            />
          </div>
        );
      })}
      <div className="flex gap-2">
        {(["door", "window"] as const).map((type) => (
          <Button key={type} variant="secondary" disabled={value.length >= rows} onClick={() => add(type)}>
            <Plus aria-hidden="true" />
            {type === "door" ? t.addDoor : t.addWindow}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
