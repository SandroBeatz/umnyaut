import { type ToolDef, tools } from "@umnyaut/catalog";
import { roomBindings } from "@/entities/room";
import type { ToolValues } from "@/entities/tool";

/** The tool's own input to store: changed fields that are not bound to “My room”. */
export function ownInput(tool: ToolDef, values: ToolValues, defaults: ToolValues): Record<string, unknown> {
  const bound = new Set(roomBindings(tool.fields).map(([name]) => name));
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  return Object.fromEntries(Object.entries(values).filter(([k, v]) => !bound.has(k) && !same(v, defaults[k])));
}

/** Title and photo of an item key from any tool that sells it. */
export function itemDef(key: string) {
  for (const tool of tools) {
    const def = tool.items?.[key];
    if (def) return def;
  }
  return undefined;
}
