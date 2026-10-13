import type { ToolId, ToolModule } from "@umnyaut/calc";
import { mergeItems, type PurchaseItem } from "@umnyaut/calc";
import { DEFAULT_COUNTRY, type ToolDef, tools } from "@umnyaut/catalog";
import { applyRoom, type RoomDraft } from "@/entities/room";
import type { ToolValues } from "@/entities/tool";

/** One work in the room list: the tool and its own input (fields not bound to “My room”, only changed ones). */
export interface ListEntry {
  /** The estimate's calc. */
  id: string;
  tool: ToolId;
  input: Readonly<Record<string, unknown>>;
}

export interface ListWork {
  id: string;
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

/**
 * Recomputes every work with the current room (tech spec §11: the room is entered once), the way the shell
 * does: defaults → stored input → room → schema → compute. A row the schema rejects (or whose module is not
 * loaded) is skipped.
 */
export function buildList(
  entries: readonly ListEntry[],
  room: RoomDraft | null,
  moduleOf: (id: ListEntry["tool"]) => ToolModule<ToolValues> | undefined,
): RoomListView {
  const ctx = { country: DEFAULT_COUNTRY };
  let wallPaint = false;
  const works = entries.flatMap((entry): ListWork[] => {
    const tool = tools.find((t) => t.id === entry.tool);
    if (!tool) return [];
    const module = moduleOf(entry.tool);
    if (!module) return [];
    const parsed = module.input.safeParse(applyRoom({ ...module.defaults(ctx), ...entry.input }, room, tool.fields));
    if (!parsed.success) return [];
    if (entry.tool === "kraska" && (parsed.data as { surface?: string }).surface !== "ceiling") wallPaint = true;
    return [{ id: entry.id, tool, items: module.compute(parsed.data, ctx).items }];
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
