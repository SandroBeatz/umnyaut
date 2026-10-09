import type { ToolDef } from "@umnyaut/catalog";
import type { Metadata } from "next";
import type { ToolText } from "./content";

/** Title and description come from the content file; draft tools are reachable for checks but never indexed. */
export function toolMetadata(tool: ToolDef, text?: ToolText): Metadata {
  return {
    title: text?.title ?? tool.title,
    ...(text && { description: text.description }),
    ...(tool.status === "draft" && { robots: { index: false, follow: false } }),
  };
}
