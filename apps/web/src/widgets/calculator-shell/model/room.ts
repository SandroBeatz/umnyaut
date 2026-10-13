import type { FieldDef } from "@umnyaut/catalog";
import type { RoomGeometry } from "@/entities/estimate";
import type { ToolValues } from "@/entities/tool";
import { isVisible, roomBindings } from "./fields";

const SIZES = ["lengthMm", "widthMm", "heightMm"] as const;

/** The room sizes this tool shows now, for the fields in the room row: the height only where it counts. */
export function sizeParts(fields: readonly FieldDef[], values: ToolValues): (typeof SIZES)[number][] {
  const keys = new Set(
    roomBindings(fields.filter((f) => isVisible(f, values))).map(([, key]) => key as keyof RoomGeometry),
  );
  return SIZES.filter((part) => keys.has(part));
}

/** A room patch as the tool's input: room key → the field bound to it. */
export function fieldsOf(patch: RoomGeometry, fields: readonly FieldDef[]): ToolValues {
  const names = new Map(roomBindings(fields).map(([name, key]) => [key, name]));
  return Object.fromEntries(
    Object.entries(patch).flatMap(([key, value]) => {
      const name = names.get(key as keyof RoomGeometry);
      return name ? [[name, value]] : [];
    }),
  );
}
