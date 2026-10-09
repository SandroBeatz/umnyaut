import { type ToolId, type ToolModule, toolModules } from "@umnyaut/calc";

/** Tool input as the shell handles it: field name → value (lengths in mm). */
export type ToolValues = Readonly<Record<string, unknown>>;

/**
 * The calc module of a tool. Every page bundles the module map for now (two small geometry tools);
 * per-tool code splitting is revisited when wave 1 lands (see Phase 6 bundle check).
 */
export function getToolModule(id: ToolId): ToolModule<ToolValues> {
  return toolModules[id] as unknown as ToolModule<ToolValues>;
}
