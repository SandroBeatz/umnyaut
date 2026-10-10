import type { FieldDef, RoomBinding } from "@umnyaut/catalog";
import type { RoomDraft } from "./store";

/** Tool input: field name → value (same shape as `ToolValues` in entities/tool). */
type Values = Readonly<Record<string, unknown>>;

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
export function applyRoom(values: Values, room: RoomDraft | null, fields: readonly FieldDef[]): Values {
  if (!room) return values;
  const next: Record<string, unknown> = { ...values };
  for (const [name, key] of roomBindings(fields)) if (room[key] !== undefined) next[name] = room[key];
  return next;
}

/** The part of a change that belongs to the room. */
export function roomPatch(changed: Values, fields: readonly FieldDef[]): RoomDraft {
  const patch: Record<string, unknown> = {};
  for (const [name, key] of roomBindings(fields)) if (name in changed) patch[key] = changed[name];
  return patch as RoomDraft;
}
