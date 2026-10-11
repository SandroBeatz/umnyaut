import { type CategoryDef, toolsIn } from "@umnyaut/catalog";
import type { Metadata } from "next";
import { openGraph } from "@/shared/lib";
import type { CategoryText } from "./content";

/** Title and description from the category's Markdown; a category with only draft tools is not indexed. */
export function categoryMetadata(category: CategoryDef, text?: CategoryText): Metadata {
  const live = toolsIn(category.slug).some((tool) => tool.status === "live");
  const title = text?.title ?? category.title;
  return {
    title,
    ...(text && { description: text.description }),
    alternates: { canonical: `/${category.slug}/` },
    openGraph: openGraph(title, text?.description ?? "", `/${category.slug}/`),
    ...(!live && { robots: { index: false, follow: false } }),
  };
}
