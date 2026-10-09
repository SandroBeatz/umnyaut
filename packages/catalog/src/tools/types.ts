import type { ToolId } from "@umnyaut/calc";
import type { CategorySlug } from "../categories";

/** Skeleton of `ToolDef`; P4.6 adds fields, presets, next steps and norms. */
export interface ToolDef {
  id: ToolId;
  category: CategorySlug;
  title: string;
  /** `draft` pages are built but `noindex` and left out of listings meant for search. */
  status: "draft" | "live";
}
