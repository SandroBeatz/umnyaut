import { type ToolId, toolModules } from "@umnyaut/calc";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** One work in the room list: the tool and its own input (fields not bound to “My room”, only changed ones). */
export interface ListEntry {
  tool: ToolId;
  input: Readonly<Record<string, unknown>>;
}

const entrySchema = z.object({
  tool: z.string().refine((id): id is ToolId => id in toolModules),
  input: z.record(z.string(), z.unknown()),
});

export const LIST_KEY = "umnyaut:list:v1";
const LIST_VERSION = 1;

/** Unknown tools and broken rows are dropped; one entry per tool, the last one wins. */
export function migrateList(persisted: unknown, _version: number): { entries: ListEntry[] } {
  const raw = (persisted as { entries?: unknown } | null)?.entries;
  const rows = Array.isArray(raw) ? raw.flatMap((row) => entrySchema.safeParse(row).data ?? []) : [];
  const byTool = new Map(rows.map((row) => [row.tool as ToolId, row as ListEntry]));
  return { entries: [...byTool.values()] };
}

interface ListState {
  entries: ListEntry[];
  /** Adds the tool's work or replaces its input. */
  put(entry: ListEntry): void;
  remove(tool: ToolId): void;
  clear(): void;
}

export const useListStore = create<ListState>()(
  persist(
    (set) => ({
      entries: [],
      put: (entry) =>
        set(({ entries }) => ({
          entries: entries.some((e) => e.tool === entry.tool)
            ? entries.map((e) => (e.tool === entry.tool ? entry : e))
            : [...entries, entry],
        })),
      remove: (tool) => set(({ entries }) => ({ entries: entries.filter((e) => e.tool !== tool) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: LIST_KEY,
      version: LIST_VERSION,
      storage: createJSONStorage(() => window.localStorage),
      partialize: ({ entries }) => ({ entries }),
      migrate: migrateList,
      merge: (persisted, current) => ({ ...current, ...migrateList(persisted, LIST_VERSION) }),
      // Read after mount only, like “My room”: the server render has no list.
      skipHydration: true,
    },
  ),
);

let hydration: Promise<void> | undefined;

export function hydrateList(): Promise<void> {
  hydration ??= Promise.resolve(useListStore.persist.rehydrate()).catch(() => undefined);
  return hydration;
}
