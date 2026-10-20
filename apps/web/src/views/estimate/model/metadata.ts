import { migrateProject } from "@umnyaut/calc";
import { estimatePage } from "@umnyaut/catalog";
import type { Metadata } from "next";
import { fill, openGraph } from "@/shared/lib";

/** The estimate is personal and lives in the browser: not indexed, not in the sitemap. */
export const estimateMetadata: Metadata = {
  title: estimatePage.title,
  description: estimatePage.description,
  alternates: { canonical: "/spisok/" },
  openGraph: openGraph(estimatePage.title, estimatePage.description, "/spisok/"),
  robots: { index: false, follow: true },
};

/** Someone's estimate by link: the snapshot is after `#`, nothing to index. */
export const sharedEstimateMetadata: Metadata = {
  title: estimatePage.byLink.title,
  description: estimatePage.byLink.description,
  alternates: { canonical: "/spisok/prosmotr/" },
  openGraph: openGraph(estimatePage.byLink.title, estimatePage.byLink.description, "/spisok/prosmotr/"),
  robots: { index: false, follow: true },
};

/**
 * A short link `/p/<id>/` (P7.4): the preview title tells the size of the estimate — never its name, which may hold a
 * person's name (tech spec §11). Personal, so not indexed.
 */
export function sharedProjectMetadata(id: string, data: unknown): Metadata {
  const t = estimatePage.byLink;
  const migrated = migrateProject(data);
  const title = migrated.ok
    ? fill(t.shortTitle, { rooms: migrated.data.rooms.length, calcs: migrated.data.calcs.length })
    : t.title;
  const path = `/p/${id}/`;
  return {
    title,
    description: t.description,
    alternates: { canonical: path },
    openGraph: openGraph(title, t.description, path),
    robots: { index: false, follow: false },
  };
}
