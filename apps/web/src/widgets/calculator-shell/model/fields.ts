import type { FieldDef, PresetDef, RoomBinding } from "@umnyaut/catalog";
import type { RoomDraft } from "@/entities/room";
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

const ROOM_KEYS: Readonly<Record<RoomBinding | "shape", keyof RoomDraft>> = {
  length: "lengthMm",
  width: "widthMm",
  height: "heightMm",
  cutLength: "cutLengthMm",
  cutWidth: "cutWidthMm",
  shape: "shape",
};

/** Field name → room key for every field bound to “My room” (openings are always bound). */
export function roomBindings(fields: readonly FieldDef[]): [string, keyof RoomDraft][] {
  return fields.flatMap((f): [string, keyof RoomDraft][] => {
    if (f.kind === "openings") return [[f.name, "openings"]];
    if ((f.kind === "length" || f.kind === "select") && f.room) return [[f.name, ROOM_KEYS[f.room]]];
    return [];
  });
}

/** Input values with the known parts of the room applied. */
export function applyRoom(values: ToolValues, room: RoomDraft | null, fields: readonly FieldDef[]): ToolValues {
  if (!room) return values;
  const next: Record<string, unknown> = { ...values };
  for (const [name, key] of roomBindings(fields)) if (room[key] !== undefined) next[name] = room[key];
  return next;
}

/** The part of a change that belongs to the room. */
export function roomPatch(changed: ToolValues, fields: readonly FieldDef[]): RoomDraft {
  const patch: Record<string, unknown> = {};
  for (const [name, key] of roomBindings(fields)) if (name in changed) patch[key] = changed[name];
  return patch as RoomDraft;
}
