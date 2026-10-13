import { type Estimate, type EstimateCalc, type EstimateTotals, migrateProject, type Surface } from "@umnyaut/calc";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { fromLegacy, LIST_KEY, ROOM_KEY } from "./legacy";
import * as ops from "./ops";

export const ESTIMATE_KEY = "umnyaut:estimate:v1";
const ESTIMATE_VERSION = 1;

/** Stored data → the estimate; unknown or broken data is no estimate. */
export function migrateEstimate(persisted: unknown, _version: number): { estimate: Estimate | null } {
  const raw = (persisted as { estimate?: unknown } | null)?.estimate;
  if (raw === undefined || raw === null) return { estimate: null };
  const result = migrateProject(raw);
  return { estimate: result.ok ? result.data : null };
}

/** A fresh estimate id: random in the browser, so two devices never share one. */
const newId = () => crypto.randomUUID().replaceAll("-", "").slice(0, 16);

interface EstimateState {
  /** `null` until the first size is entered: the estimate is created silently (scenario 1). */
  estimate: Estimate | null;
  /** The last removed calc, for «Вернуть». */
  removed: ops.Removed | null;

  /** The room-bound part of a tool's input → the active room (created when there is none). */
  patchActiveRoom(patch: ops.RoomGeometry): void;
  clearActiveRoom(): void;
  addRoom(patch?: Parameters<typeof ops.addRoom>[1]): string | undefined;
  updateRoom(id: string, patch: Parameters<typeof ops.updateRoom>[2]): void;
  removeRoom(id: string): void;
  setActiveRoom(id: string): void;

  addCalc(calc: ops.NewCalc): string | undefined;
  updateCalc(id: string, patch: Parameters<typeof ops.updateCalc>[2]): void;
  markAdded(id: string): void;
  removeCalc(id: string): void;
  undoRemove(): void;
  splitCalc(id: string, surfaces: readonly [Surface, Surface]): string | undefined;
  /** The room list on the estimate until stage C: one calc per tool in the active room. */
  putToolCalc(calc: Pick<EstimateCalc, "tool" | "toolVersion" | "input">): void;
  /** Removes the active room's calcs of these tools (all of them without a list). */
  removeToolCalcs(tools?: readonly string[]): void;

  setPrice(productKey: string, price: number | undefined): void;
  setTotals(totals: Omit<EstimateTotals, "at">): void;
}

export const useEstimateStore = create<EstimateState>()(
  persist(
    (set, get) => {
      /** Runs a step on the estimate there is; with none, nothing happens. */
      const apply = (step: (estimate: Estimate, now: number) => Estimate) => {
        const { estimate } = get();
        if (estimate) set({ estimate: step(estimate, Date.now()) });
      };
      return {
        estimate: null,
        removed: null,

        patchActiveRoom: (patch) =>
          set(({ estimate }) => ({ estimate: ops.patchActiveRoom(estimate, patch, Date.now(), newId) })),
        clearActiveRoom: () =>
          apply((e, now) => {
            const room = ops.activeRoomOf(e);
            return room ? ops.clearRoomGeometry(e, room.id, now) : e;
          }),
        addRoom: (patch = {}) => {
          const result = ops.addRoom(get().estimate ?? ops.createEstimate(newId(), Date.now()), patch, Date.now());
          set({ estimate: result.estimate });
          return result.id;
        },
        updateRoom: (id, patch) => apply((e, now) => ops.updateRoom(e, id, patch, now)),
        removeRoom: (id) => apply((e, now) => ops.removeRoom(e, id, now)),
        setActiveRoom: (id) => apply((e) => ops.setActiveRoom(e, id)),

        addCalc: (calc) => {
          const { estimate } = get();
          if (!estimate) return undefined;
          const result = ops.addCalc(estimate, calc, Date.now());
          set({ estimate: result.estimate });
          return result.id;
        },
        updateCalc: (id, patch) => apply((e, now) => ops.updateCalc(e, id, patch, now)),
        markAdded: (id) => apply((e, now) => ops.markAdded(e, id, now)),
        removeCalc: (id) => {
          const { estimate } = get();
          if (!estimate) return;
          const result = ops.removeCalc(estimate, id, Date.now());
          if (result.removed) set({ estimate: result.estimate, removed: result.removed });
        },
        undoRemove: () => {
          const { estimate, removed } = get();
          if (estimate && removed) set({ estimate: ops.restoreCalc(estimate, removed, Date.now()), removed: null });
        },
        splitCalc: (id, surfaces) => {
          const { estimate } = get();
          if (!estimate) return undefined;
          const result = ops.splitCalc(estimate, id, surfaces, Date.now());
          set({ estimate: result.estimate });
          return result.id;
        },
        putToolCalc: (calc) =>
          set(({ estimate }) => ({ estimate: ops.putToolCalc(estimate, calc, Date.now(), newId) })),
        removeToolCalcs: (tools) =>
          apply((e, now) => {
            const room = ops.activeRoomOf(e);
            const gone = (c: EstimateCalc) => c.roomId === room?.id && (!tools || tools.includes(c.tool));
            return e.calcs.some(gone) ? { ...e, calcs: e.calcs.filter((c) => !gone(c)), updatedAt: now } : e;
          }),

        setPrice: (key, price) => apply((e, now) => ops.setPrice(e, key, price, now)),
        setTotals: (totals) => apply((e, now) => ops.setTotals(e, totals, now)),
      };
    },
    {
      name: ESTIMATE_KEY,
      version: ESTIMATE_VERSION,
      // `window.` throws on the server, so no storage is created there (Node 24 has its own `localStorage`).
      storage: createJSONStorage(() => window.localStorage),
      partialize: ({ estimate }) => ({ estimate }),
      migrate: migrateEstimate,
      merge: (persisted, current) => ({ ...current, ...migrateEstimate(persisted, ESTIMATE_VERSION) }),
      // The first client render must equal the server render: the estimate is read only after mount.
      skipHydration: true,
    },
  ),
);

/**
 * One-time move from «Моя комната» and the room list (spec «Перенос со старой версии»): the old keys are removed
 * only once the estimate is written. A stored estimate wins over old data from a stale tab.
 */
function adoptLegacy() {
  const storage = window.localStorage;
  const room = storage.getItem(ROOM_KEY);
  const list = storage.getItem(LIST_KEY);
  if (room === null && list === null) return;
  const state = (raw: string | null): unknown => {
    try {
      return raw === null ? null : (JSON.parse(raw) as { state?: unknown }).state;
    } catch {
      return null;
    }
  };
  if (!useEstimateStore.getState().estimate) {
    const estimate = fromLegacy(state(room), state(list), Date.now(), newId());
    if (estimate) useEstimateStore.setState({ estimate });
  }
  if (!useEstimateStore.getState().estimate || storage.getItem(ESTIMATE_KEY) !== null) {
    storage.removeItem(ROOM_KEY);
    storage.removeItem(LIST_KEY);
  }
}

let hydration: Promise<void> | undefined;

/** Reads the stored estimate once per page (moving old data on the first run); call from an effect. */
export function hydrateEstimate(): Promise<void> {
  hydration ??= Promise.resolve(useEstimateStore.persist.rehydrate())
    .then(adoptLegacy)
    .catch(() => undefined);
  return hydration;
}

/** The active room or `null` — the same object while it is unchanged, so it is safe as a selector. */
export const selectActiveRoom = (s: Pick<EstimateState, "estimate">) => ops.activeRoomOf(s.estimate);

export const useActiveRoom = () => useEstimateStore(selectActiveRoom);

/** Calcs of the active room already in the estimate (the room list until stage C). */
export const selectActiveCalcs = (s: Pick<EstimateState, "estimate">): readonly EstimateCalc[] => {
  const room = ops.activeRoomOf(s.estimate);
  return room ? (s.estimate?.calcs ?? []).filter((c) => c.roomId === room.id && c.addedAt !== undefined) : [];
};

export const useActiveCalcs = () => useEstimateStore(useShallow(selectActiveCalcs));
