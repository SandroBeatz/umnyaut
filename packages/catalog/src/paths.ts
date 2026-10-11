import type { ToolId } from "@umnyaut/calc";
import type { CategorySlug } from "./categories";

/** A tool's URL. Its own module, so a link does not pull the whole tool registry into a page bundle. */
export function toolPath(tool: { category: CategorySlug; id: ToolId }): string {
  return `/${tool.category}/${tool.id}/`;
}
