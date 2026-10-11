import { sitemapEntries } from "@server/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
