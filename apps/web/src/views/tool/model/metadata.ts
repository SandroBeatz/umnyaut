import type { ToolDef } from "@umnyaut/catalog";
import type { Metadata } from "next";

/** Draft tools are reachable for checks but never indexed. */
export function toolMetadata(tool: ToolDef): Metadata {
  return {
    title: tool.title,
    ...(tool.status === "draft" && { robots: { index: false, follow: false } }),
  };
}
