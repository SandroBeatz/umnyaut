import { type Norm, norms, normTitles, type ToolDef, tools } from "@umnyaut/catalog";
import { type SourceLink, splitSources } from "@/shared/lib";

export interface NormRow {
  id: string;
  title: string;
  norm: Norm;
  /** «Ceresit CM 11 PRO» + its URL, one per source of the norm. */
  sources: SourceLink[];
}

export interface NormGroup {
  tool?: ToolDef;
  rows: NormRow[];
}

/** Norms grouped by the first live tool that uses them, in catalog order; unused norms go last. */
export function normGroups(): NormGroup[] {
  const seen = new Set<string>();
  const row = (id: string): NormRow[] => {
    const norm = norms[id];
    if (!norm || seen.has(id)) return [];
    seen.add(id);
    return [{ id, title: normTitles[id] ?? id, norm, sources: splitSources(norm.source) }];
  };
  const groups: NormGroup[] = tools
    .filter((tool) => tool.status === "live")
    .map((tool) => ({ tool, rows: (tool.norms ?? []).flatMap(row) }))
    .filter((group) => group.rows.length > 0);
  const rest = Object.keys(norms).flatMap(row);
  return rest.length > 0 ? [...groups, { rows: rest }] : groups;
}
