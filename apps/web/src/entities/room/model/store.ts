import type { Opening } from "@umnyaut/calc";
import { z } from "zod";
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
  openings?: readonly Opening[];
}

const mm = z.number().int().positive().max(100_000);
const roomSchema = z.object({
  shape: z.enum(["rect", "l"]).optional(),
  lengthMm: mm.optional(),
  widthMm: mm.optional(),
  heightMm: mm.optional(),
  cutLengthMm: z.number().int().min(0).max(100_000).optional(),
  cutWidthMm: z.number().int().min(0).max(100_000).optional(),
  openings: z
    .array(
      z.object({
        type: z.enum(["door", "window"]),
        widthMm: mm,
        heightMm: mm,
        count: z.number().int().min(0).max(50),
      }),
    )
    .max(20)
    .optional(),
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
