import { type ToolDef, toolPath } from "@umnyaut/catalog";
import type { Metadata } from "next";
import type { ToolText } from "./content";

/**
 * Title and description come from the content file; the canonical is always the clean URL, so `?s=` links never
 * duplicate the page. Draft tools are reachable for checks but never indexed.
 */
export function toolMetadata(tool: ToolDef, text?: ToolText): Metadata {
  return {
    title: text?.title ?? tool.title,
    ...(text && { description: text.description }),
    alternates: { canonical: toolPath(tool) },
    ...(tool.status === "draft" && { robots: { index: false, follow: false } }),
  };
}
