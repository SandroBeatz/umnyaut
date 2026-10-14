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
  return Object.entries(field.when).every(([key, value]) =>
    Array.isArray(value) ? value.includes(values[key] as string) : values[key] === value,
  );
}

/** Room shape and its L-cut: part of the room, so they stand right under its length and width. */
export function isRoomShape(field: FieldDef): boolean {
  if (field.kind === "select") return field.room === "shape" || field.room === "cutCorner";
  return field.kind === "length" && (field.room === "cutLength" || field.room === "cutWidth");
}

/**
 * Visible fields split into the always-open grid and «Ещё параметры»: the room shape group follows the last room
 * length or width field (before laying, presets and the rest), whatever its `main` flag.
 */
export function formSections(fields: readonly FieldDef[], values: ToolValues) {
  const visible = fields.filter((field) => isVisible(field, values));
  const shape = visible.filter(isRoomShape);
  const main = visible.filter((field) => field.main && !isRoomShape(field));
  if (shape.length > 0) {
    let at = 0;
    for (const [i, field] of main.entries()) {
      if (field.kind === "length" && (field.room === "length" || field.room === "width")) at = i + 1;
    }
    main.splice(at, 0, ...shape);
  }
  return { main, more: visible.filter((field) => !field.main && !isRoomShape(field)) };
}

/** Fields that take half a row of the form grid; the rest span both columns. */
export function isHalfWidth(field: FieldDef): boolean {
  if (field.kind === "select") return field.dropdown === true || field.options.length > 4;
  return field.kind === "length" || field.kind === "number" || field.kind === "price";
}

/**
 * The room shape as a half-row dropdown when the next always-open field is half a row too (they share the row, so
 * the phone's first screen does not grow); otherwise a full-width segment without a separate label.
 */
export function shapeAsDropdown(main: readonly FieldDef[]): boolean {
  const start = main.findIndex(isRoomShape);
  if (start < 0) return false;
  const next = main.slice(start).find((field) => !isRoomShape(field));
  return next !== undefined && isHalfWidth(next);
}

/** Changed fields behind «Ещё параметры · N». */
export function changedHidden(fields: readonly FieldDef[], values: ToolValues, defaults: ToolValues): number {
  const { more } = formSections(fields, values);
  return more.filter((f) => "name" in f && !same(values[f.name], defaults[f.name])).length;
}

/** The preset whose values all match the current input, if any. */
export function matchingPreset(presets: readonly PresetDef[], ids: readonly string[], values: ToolValues) {
  return presets.find((p) => ids.includes(p.id) && Object.entries(p.values).every(([k, v]) => same(values[k], v)))?.id;
}

export { applyRoom, roomBindings, roomPatch } from "@/entities/room";

/**
 * The form has lengths the м/см switch converts: the room's sizes (typed in the room row), a length in metres, or the
 * doors and windows.
 */
export function hasRoomUnits(fields: readonly FieldDef[]): boolean {
  return fields.some((field) => (field.kind === "length" && field.unit === "m") || field.kind === "openings");
}
