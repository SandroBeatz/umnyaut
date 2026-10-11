import { type CutCorner, cutCornerSchema, type Opening, openingPlacesSchema } from "@umnyaut/calc";
import * as z from "zod/mini";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * “My room” as the user has filled it so far. Every part is optional: the room area tool knows no height,
 * so nothing is invented. Lengths in integer mm.
 */
export interface RoomDraft {
  shape?: "rect" | "l";
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  cutLengthMm?: number;
  cutWidthMm?: number;
  /** Where the L-cut sits on the plan. */
  cutCorner?: CutCorner;
  openings?: readonly Opening[];
}

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

export const ROOM_KEY = "umnyaut:room:v1";
const ROOM_VERSION = 1;

/** Upgrades what an older build stored; unknown or broken data becomes “no room”. */
export function migrateRoom(persisted: unknown, _version: number): { room: RoomDraft | null } {
  const room = (persisted as { room?: unknown } | null)?.room;
  const parsed = roomSchema.safeParse(room);
  return { room: parsed.success && Object.keys(parsed.data).length > 0 ? parsed.data : null };
}

interface RoomState {
  room: RoomDraft | null;
  /** Merges known parts; `undefined` values are ignored. */
  updateRoom(patch: RoomDraft): void;
  clearRoom(): void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      room: null,
      updateRoom: (patch) =>
        set(({ room }) => {
          const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
          return { room: { ...room, ...defined } };
        }),
      clearRoom: () => set({ room: null }),
    }),
    {
      name: ROOM_KEY,
      version: ROOM_VERSION,
      // `window.` throws on the server, so no storage is created there (Node 24 has its own `localStorage`).
      storage: createJSONStorage(() => window.localStorage),
      partialize: ({ room }) => ({ room }),
      migrate: migrateRoom,
      merge: (persisted, current) => ({ ...current, ...migrateRoom(persisted, ROOM_VERSION) }),
      // The first client render must equal the server render: the room is read only after mount.
      skipHydration: true,
    },
  ),
);

let hydration: Promise<void> | undefined;

/** Reads the stored room once per page; call from an effect. */
export function hydrateRoom(): Promise<void> {
  hydration ??= Promise.resolve(useRoomStore.persist.rehydrate()).catch(() => undefined);
  return hydration;
}
