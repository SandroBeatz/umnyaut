import { mergeItems, type PurchaseItem } from "@umnyaut/calc";
import { DEFAULT_COUNTRY, type ToolDef, tools } from "@umnyaut/catalog";
import { applyRoom, type RoomDraft, roomBindings } from "@/entities/room";
import { getToolModule, type ToolValues } from "@/entities/tool";
import type { ListEntry } from "./store";

export interface ListWork {
  tool: ToolDef;
  items: readonly PurchaseItem[];
}

export interface RoomListView {
  works: ListWork[];
  /** Every work's items merged: same item in the same pack is summed and rounded to packs once. */
  items: PurchaseItem[];
  /** Purchase tools of the same categories that are not in the list yet. */
  next: ToolDef[];
  /** Works that cover the same surface twice (wallpaper and paint on the walls). */
  conflicts: "walls_twice"[];
}

/** The tool's own input to store: changed fields that are not bound to “My room”. */
export function ownInput(tool: ToolDef, values: ToolValues, defaults: ToolValues): Record<string, unknown> {
  const bound = new Set(roomBindings(tool.fields).map(([name]) => name));
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  return Object.fromEntries(Object.entries(values).filter(([k, v]) => !bound.has(k) && !same(v, defaults[k])));
}

/**
 * Recomputes every work with the current room (tech spec §11: the room is entered once), the way the shell
 * does: defaults → stored input → room → schema → compute. A row the schema rejects is skipped.
 */
export function buildList(entries: readonly ListEntry[], room: RoomDraft | null): RoomListView {
  const ctx = { country: DEFAULT_COUNTRY };
  let wallPaint = false;
  const works = entries.flatMap((entry): ListWork[] => {
    const tool = tools.find((t) => t.id === entry.tool);
    if (!tool) return [];
    const module = getToolModule(entry.tool);
    const parsed = module.input.safeParse(applyRoom({ ...module.defaults(ctx), ...entry.input }, room, tool.fields));
    if (!parsed.success) return [];
    if (entry.tool === "kraska" && (parsed.data as { surface?: string }).surface !== "ceiling") wallPaint = true;
    return [{ tool, items: module.compute(parsed.data, ctx).items }];
  });
  const inList = new Set(works.map((w) => w.tool.id));
  const categories = new Set(works.map((w) => w.tool.category));
  // A material counted by its own tool (adhesive in «Плиточный клей») replaces the same material that another
  // work brings as related (adhesive in «Плитка») — summing both would buy it twice for one floor.
  const ownKeys = new Set(works.flatMap((w) => w.items.filter((i) => i.role === "main").map((i) => i.key)));
  const items = works.flatMap((w) => w.items.filter((i) => i.role === "main" || !ownKeys.has(i.key)));
  // Do not suggest a tool whose material the list already has (tile brings adhesive and grout).
  const listed = new Set(items.map((i) => i.key));
  const next = tools.filter((t) => {
    if (t.status !== "live" || !t.items || !categories.has(t.category) || inList.has(t.id)) return false;
    const main = Object.keys(t.items)[0];
    return !(main && listed.has(main));
  });
  const conflicts: RoomListView["conflicts"] = wallPaint && inList.has("oboi") ? ["walls_twice"] : [];
  return { works, items: mergeItems(items), next, conflicts };
}

/** Title and photo of an item key from any tool that sells it. */
export function itemDef(key: string) {
  for (const tool of tools) {
    const def = tool.items?.[key];
    if (def) return def;
  }
  return undefined;
}
