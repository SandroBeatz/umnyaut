import type { ToolId, ToolModule } from "@umnyaut/calc";
import { tools } from "@umnyaut/catalog";
import { useEffect, useMemo, useState } from "react";
import { loadToolModule, type ToolValues } from "@/entities/tool";

const known = new Set<string>(tools.map((t) => t.id));

/**
 * The calculators of these tool ids, each loaded once on demand (an estimate's calcs). `undefined` until every known
 * id is loaded; an id the catalog no longer has is skipped.
 */
export function useToolModules(
  ids: readonly string[],
): ((id: ToolId) => ToolModule<ToolValues> | undefined) | undefined {
  const [modules, setModules] = useState<ReadonlyMap<string, ToolModule<ToolValues>>>(() => new Map());
  const missing = [...new Set(ids)].filter((id) => known.has(id) && !modules.has(id));
  const key = missing.join(",");

  useEffect(() => {
    if (key === "") return;
    let live = true;
    void Promise.all(key.split(",").map(async (id) => [id, await loadToolModule(id as ToolId)] as const)).then(
      (loaded) => {
        if (live) setModules((now) => new Map([...now, ...loaded]));
      },
    );
    return () => {
      live = false;
    };
  }, [key]);

  // One function per loaded set, so effects that depend on it run when a module arrives, not on every render.
  const moduleOf = useMemo(() => (id: ToolId) => modules.get(id), [modules]);
  return key === "" ? moduleOf : undefined;
}
