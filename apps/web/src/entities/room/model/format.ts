import { formatDimensions } from "@umnyaut/ui/format";
import type { RoomDraft } from "./store";

/** «4,6 × 4,3 × 2,7 м» from the parts that are known; `undefined` while length or width is missing. */
export function roomDimensions(room: RoomDraft | null, unit: string): string | undefined {
  if (!room?.lengthMm || !room.widthMm) return undefined;
  const values = [room.lengthMm, room.widthMm, ...(room.heightMm ? [room.heightMm] : [])].map((mm) => mm / 1000);
  return formatDimensions(values, unit);
}
