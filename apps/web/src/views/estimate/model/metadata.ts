import { estimatePage } from "@umnyaut/catalog";
import type { Metadata } from "next";

/** The estimate is personal and lives in the browser: not indexed, not in the sitemap. */
export const estimateMetadata: Metadata = {
  title: estimatePage.title,
  description: estimatePage.description,
  alternates: { canonical: "/spisok/" },
  robots: { index: false, follow: true },
};
