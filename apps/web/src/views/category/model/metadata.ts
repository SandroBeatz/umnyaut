import { type CategoryDef, toolsIn } from "@umnyaut/catalog";
import type { Metadata } from "next";

/** A category with only draft tools is not indexed either. */
export function categoryMetadata(category: CategoryDef): Metadata {
  const live = toolsIn(category.slug).some((tool) => tool.status === "live");
  return {
    title: category.title,
    alternates: { canonical: `/${category.slug}/` },
    ...(!live && { robots: { index: false, follow: false } }),
  };
}
