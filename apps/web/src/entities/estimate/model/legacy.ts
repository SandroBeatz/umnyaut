import { cutCornerSchema, type Estimate, openingPlacesSchema } from "@umnyaut/calc";
import * as z from "zod/mini";
import { addRoom, createEstimate, putToolCalc, type RoomGeometry } from "./ops";

/** «Моя комната» and «Список для комнаты» of the builds before the estimate; read once, then removed. */
export const ROOM_KEY = "umnyaut:room:v1";
export const LIST_KEY = "umnyaut:list:v1";

const mm = z.int().check(z.positive(), z.maximum(100_000));
const roomSchema = z.object({
  shape: z.optional(z.enum(["rect", "l"])),
  lengthMm: z.optional(mm),
  widthMm: z.optional(mm),
  heightMm: z.optional(mm),
  cutLengthMm: z.optional(z.int().check(z.minimum(0), z.maximum(100_000))),
  cutWidthMm: z.optional(z.int().check(z.minimum(0), z.maximum(100_000))),
  cutCorner: z.optional(cutCornerSchema),
  openings: z.optional(
    z
      .array(
        z.object({
          type: z.enum(["door", "window"]),
          widthMm: mm,
          heightMm: mm,
          count: z.int().check(z.minimum(0), z.maximum(50)),
          places: z.optional(openingPlacesSchema),
        }),
      )
      .check(z.maxLength(20)),
  ),
});

/** Tool id by its shape only: the registry stays out of every page's JS; the list skips tools it does not know. */
const entrySchema = z.object({
  tool: z.string().check(z.regex(/^[a-z0-9-]+$/)),
  input: z.record(z.string(), z.unknown()),
});

/** The old stored room; broken or empty data is no room. */
export function legacyRoom(state: unknown): RoomGeometry | null {
  const parsed = roomSchema.safeParse((state as { room?: unknown } | null)?.room);
  return parsed.success && Object.keys(parsed.data).length > 0 ? parsed.data : null;
}

/** The old list's rows; broken rows are dropped, the last row of a tool wins. */
export function legacyList(state: unknown): z.infer<typeof entrySchema>[] {
  const raw = (state as { entries?: unknown } | null)?.entries;
  const rows = Array.isArray(raw) ? raw.flatMap((row) => entrySchema.safeParse(row).data ?? []) : [];
  return [...new Map(rows.map((row) => [row.tool, row])).values()];
}

/**
 * The old room becomes «Комната 1», the old list its calcs, already in the estimate (spec «Перенос со старой
 * версии»). The formula version was not stored then: 0 = not known. Nothing worth moving → `null`.
 */
export function fromLegacy(roomState: unknown, listState: unknown, now: number, id: string): Estimate | null {
  const room = legacyRoom(roomState);
  const entries = legacyList(listState);
  if (!room && entries.length === 0) return null;
  let estimate = addRoom(createEstimate(id, now), room ?? {}, now).estimate;
  for (const entry of entries) {
    estimate = putToolCalc(estimate, { tool: entry.tool, toolVersion: 0, input: entry.input }, now, () => id);
  }
  return estimate;
}
