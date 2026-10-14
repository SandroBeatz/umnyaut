import { estimatePage } from "@umnyaut/catalog";
import type { Metadata } from "next";

/** The estimate is personal and lives in the browser: not indexed, not in the sitemap. */
export const estimateMetadata: Metadata = {
  title: estimatePage.title,
  description: estimatePage.description,
  alternates: { canonical: "/spisok/" },
  robots: { index: false, follow: true },
};

/** Someone's estimate by link: the snapshot is after `#`, nothing to index. */
export const sharedEstimateMetadata: Metadata = {
  title: estimatePage.byLink.title,
  description: estimatePage.byLink.description,
  alternates: { canonical: "/spisok/prosmotr/" },
  robots: { index: false, follow: true },
};
