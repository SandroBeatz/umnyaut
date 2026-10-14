import { floorAreaM2 } from "@umnyaut/calc";
import { unitLabels } from "@umnyaut/catalog";
import { formatDimensions, formatNumber, NBSP } from "@umnyaut/ui/format";
import type { RoomDraft } from "./draft";

/** «4,6 × 4,3 × 2,7 м» from the parts that are known; `undefined` while length or width is missing. */
export function roomDimensions(room: RoomDraft | null, unit: string): string | undefined {
  if (!room?.lengthMm || !room.widthMm) return undefined;
  const values = [room.lengthMm, room.widthMm, ...(room.heightMm ? [room.heightMm] : [])].map((mm) => mm / 1000);
  return formatDimensions(values, unit);
}

/** A room's floor, as the room area tool counts it; none without length and width. */
export function floorOf(room: RoomDraft): number | undefined {
  if (!room.lengthMm || !room.widthMm) return undefined;
  const cut = room.shape === "l" && room.cutLengthMm && room.cutWidthMm;
  return floorAreaM2({
    shape: cut ? "l" : "rect",
    lengthMm: room.lengthMm,
    widthMm: room.widthMm,
    heightMm: room.heightMm ?? 0,
    ...(cut ? { cut: { lengthMm: room.cutLengthMm ?? 0, widthMm: room.cutWidthMm ?? 0 } } : {}),
    openings: [],
  });
}

/** «19,8 м²». */
export const areaText = (m2: number) => `${formatNumber(m2, { maxFraction: 1 })}${NBSP}${unitLabels.m2}`;
