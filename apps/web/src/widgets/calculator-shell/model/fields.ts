import type { FieldDef, PresetDef } from "@umnyaut/catalog";
import type { ToolValues } from "@/entities/tool";

export type LengthUnit = "m" | "cm";

const FACTOR = { m: 1000, cm: 10, mm: 1 } as const;

/** mm → the number shown in a length field. */
export const toDisplay = (mm: number, unit: keyof typeof FACTOR) => mm / FACTOR[unit];
/** Typed number → integer mm. */
export const fromDisplay = (value: number, unit: keyof typeof FACTOR) => Math.round(value * FACTOR[unit]);

export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Fields hidden by `when` don't render and don't count. */
export function isVisible(field: FieldDef, values: ToolValues): boolean {
  if (!("when" in field) || !field.when) return true;
  return Object.entries(field.when).every(([key, value]) => values[key] === value);
}

/** Changed fields behind «Ещё параметры · N». */
export function changedHidden(fields: readonly FieldDef[], values: ToolValues, defaults: ToolValues): number {
  return fields.filter((f) => !f.main && "name" in f && isVisible(f, values) && !same(values[f.name], defaults[f.name]))
    .length;
}

/** The preset whose values all match the current input, if any. */
export function matchingPreset(presets: readonly PresetDef[], ids: readonly string[], values: ToolValues) {
  return presets.find((p) => ids.includes(p.id) && Object.entries(p.values).every(([k, v]) => same(values[k], v)))?.id;
}

export { applyRoom, roomBindings, roomPatch } from "@/entities/room";
