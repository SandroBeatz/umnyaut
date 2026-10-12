import type { CutCorner } from "@umnyaut/calc";
import type { ToolValues } from "@/entities/tool";
import type { PlanRoom } from "@/features/edit-room-plan";

const num = (v: unknown) => (typeof v === "number" && v > 0 ? v : undefined);

/** The room the plan editor draws, from a tool's input (length, width and the L-cut, if the tool has them). */
export function planRoomOf(values: ToolValues): PlanRoom {
  const cutLength = num(values.cutLengthMm);
  const cutWidth = num(values.cutWidthMm);
  return {
    lengthMm: num(values.lengthMm) ?? 4000,
    widthMm: num(values.widthMm) ?? 3000,
    // Walls are tiled in a rectangular room only (tile «Стены»): the L-cut is the floor's.
    cut:
      values.shape === "l" && values.surface !== "walls" && cutLength && cutWidth
        ? { lengthMm: cutLength, widthMm: cutWidth }
        : undefined,
    cutCorner: (values.cutCorner as CutCorner | undefined) ?? "se",
  };
}
