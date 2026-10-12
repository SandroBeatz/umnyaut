import { type ToolId, type ToolModule, toolModules } from "@umnyaut/calc";

/** Tool input as the shell handles it: field name → value (lengths in mm). */
export type ToolValues = Readonly<Record<string, unknown>>;

/**
 * The calc module of a tool, from the map of all of them: for the server and the home page's lazy cards. A tool
 * page gets only its own module (`ToolCalculator`), the room list loads its modules with `loadToolModule`.
 */
export function getToolModule(id: ToolId): ToolModule<ToolValues> {
  return toolModules[id] as unknown as ToolModule<ToolValues>;
}
