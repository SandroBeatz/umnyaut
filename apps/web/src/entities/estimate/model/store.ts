import { type Estimate, type EstimateCalc, type EstimateTotals, migrateProject, type Surface } from "@umnyaut/calc";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { ESTIMATE_EVENT, ESTIMATE_KEY } from "@/shared/config";
import { fromLegacy, LIST_KEY, ROOM_KEY } from "./legacy";
import * as ops from "./ops";

export { ESTIMATE_KEY };

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

  rename(name: string): void;
  /** The room-bound part of a tool's input → the active room (created when there is none). */
  patchActiveRoom(patch: ops.RoomGeometry): void;
  clearActiveRoom(): void;
  addRoom(patch?: Parameters<typeof ops.addRoom>[1]): string | undefined;
  updateRoom(id: string, patch: Parameters<typeof ops.updateRoom>[2]): void;
  /** The room editor's save: replaces the room (or adds a new one) and resets wall-bound fields (Р10). */
  saveRoom(
    id: string | undefined,
    room: ops.SavedRoom,
    wallBound: Readonly<Record<string, readonly string[]>>,
  ): string | undefined;
  removeRoom(id: string): void;
  setActiveRoom(id: string): void;

  addCalc(calc: ops.NewCalc): string | undefined;
  updateCalc(id: string, patch: Parameters<typeof ops.updateCalc>[2]): void;
  markAdded(id: string): void;
  setDraft(id: string, draft: Readonly<Record<string, unknown>> | undefined): void;
  commitDraft(id: string, saved: { surface: Surface | undefined; toolVersion: number }): void;
  openCalc(id: string): void;
  removeCalc(id: string): void;
  undoRemove(): void;
  splitCalc(id: string, surfaces: readonly [Surface, Surface]): string | undefined;

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

        rename: (name) => apply((e, now) => ops.renameEstimate(e, name, now)),
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
        saveRoom: (id, room, wallBound) => {
          const result = ops.saveRoom(
            get().estimate ?? ops.createEstimate(newId(), Date.now()),
            id,
            room,
            wallBound,
            Date.now(),
          );
          set({ estimate: result.estimate });
          return result.id;
        },
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
        setDraft: (id, draft) => apply((e, now) => ops.setDraft(e, id, draft, now)),
        commitDraft: (id, saved) => apply((e, now) => ops.commitDraft(e, id, saved, now)),
        openCalc: (id) => apply((e, now) => ops.openCalc(e, id, now)),
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
        setPrice: (key, price) => apply((e, now) => ops.setPrice(e, key, price, now)),
        setTotals: (totals) => apply((e, now) => ops.setTotals(e, totals, now)),
      };
    },
    {
      name: ESTIMATE_KEY,
      version: ESTIMATE_VERSION,
      // `window.` throws on the server, so no storage is created there (Node 24 has its own `localStorage`).
      // Every write also tells this tab (the header's sum); other tabs hear the `storage` event.
      storage: createJSONStorage(() => ({
        // A full or blocked storage keeps the estimate in memory for this visit instead of breaking the edit.
        getItem: (key) => {
          try {
            return window.localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            window.localStorage.setItem(key, value);
          } catch {
            return;
          }
          window.dispatchEvent(new Event(ESTIMATE_EVENT));
        },
        removeItem: (key) => {
          try {
            window.localStorage.removeItem(key);
          } catch {
            // Nothing to remove from a storage we cannot reach.
          }
        },
      })),
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

/** Every calc of the active room, drafts too (overlaps between tools). */
export const useRoomCalcs = () =>
  useEstimateStore(
    useShallow((s): readonly EstimateCalc[] => {
      const room = ops.activeRoomOf(s.estimate);
      return room ? (s.estimate?.calcs ?? []).filter((c) => c.roomId === room.id) : [];
    }),
  );

/** Every calc of a tool in the active room, drafts too, in estimate order (the chips row). */
export const useToolCalcs = (tool: string) =>
  useEstimateStore(
    useShallow((s): readonly EstimateCalc[] => {
      const room = ops.activeRoomOf(s.estimate);
      return room ? (s.estimate?.calcs ?? []).filter((c) => c.roomId === room.id && c.tool === tool) : [];
    }),
  );
