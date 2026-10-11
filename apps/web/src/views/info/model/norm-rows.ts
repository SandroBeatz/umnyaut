import { type Norm, norms, normTitles, type ToolDef, tools } from "@umnyaut/catalog";

export interface NormRow {
  id: string;
  title: string;
  norm: Norm;
  /** «Ceresit CM 11 PRO» + its URL, one per source of the norm. */
  sources: { label: string; url?: string }[];
}

export interface NormGroup {
  tool?: ToolDef;
  rows: NormRow[];
}

/** «Name, https://…» → label and link; plain text («по опыту укладчиков») stays a label. */
export function splitSources(source: string): NormRow["sources"] {
  return source.split("; ").map((part) => {
    const match = /^(.*?),?\s*(https?:\/\/\S+)$/.exec(part.trim());
    return match ? { label: match[1] || match[2] || part, url: match[2] } : { label: part.trim() };
  });
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
