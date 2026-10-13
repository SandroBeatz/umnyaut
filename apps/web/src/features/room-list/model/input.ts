import { tools } from "@umnyaut/catalog";

/** Title and photo of an item key from any tool that sells it. */
export function itemDef(key: string) {
  for (const tool of tools) {
    const def = tool.items?.[key];
    if (def) return def;
  }
  return undefined;
}
