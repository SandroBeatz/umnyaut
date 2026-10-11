import "server-only";
import { activeCategories, navigation, site, toolPath, tools, toolsIn } from "@umnyaut/catalog";
import { loadCategoryContent, loadPageContent, loadToolContent } from "../content";

export interface SitemapEntry {
  url: string;
  /** YYYY-MM-DD: the last text or formula change (bump the text's `updatedAt` with a formula `version`). */
  lastModified: string;
}

const latest = (dates: readonly (string | undefined)[]) =>
  dates.filter((d): d is string => d !== undefined).reduce((a, b) => (a > b ? a : b), "2026-01-01");

/**
 * Indexable pages only (docs/business/seo-and-analytics.md → Technical SEO): live tools, categories with a live
 * tool, info pages that are not drafts, home. Draft tools, 404, `/dev/` and saved projects never appear.
 */
export function sitemapEntries(): SitemapEntry[] {
  const live = tools.filter((tool) => tool.status === "live");
  const toolDate = new Map(
    live.map((tool) => {
      const fm = loadToolContent(tool.id)?.frontmatter;
      return [tool.id, latest([fm?.updatedAt, fm?.checkedAt])];
    }),
  );

  const toolEntries = live.map((tool) => ({
    url: `${site.url}${toolPath(tool)}`,
    lastModified: toolDate.get(tool.id) ?? latest([]),
  }));

  const categoryEntries = activeCategories()
    .filter((category) => toolsIn(category.slug).some((tool) => tool.status === "live"))
    .map((category) => ({
      url: `${site.url}/${category.slug}/`,
      lastModified: latest([
        loadCategoryContent(category.slug)?.frontmatter.updatedAt,
        ...toolsIn(category.slug).map((tool) => toolDate.get(tool.id)),
      ]),
    }));

  const pageEntries = navigation.infoPages.flatMap(({ href }) => {
    const { frontmatter } = loadPageContent(href.replaceAll("/", ""));
    return frontmatter.draft ? [] : [{ url: `${site.url}${href}`, lastModified: frontmatter.updatedAt }];
  });

  const home = { url: `${site.url}/`, lastModified: latest([...toolDate.values()]) };
  return [home, ...categoryEntries, ...toolEntries, ...pageEntries];
}

/** robots.txt: only `/api/` closed; Yandex drops `s` (shared input) so `?s=` links are not separate pages. */
export function robotsTxt(): string {
  return [
    "User-agent: *",
    "Disallow: /api/",
    "",
    "User-agent: Yandex",
    "Disallow: /api/",
    "Clean-param: s",
    "",
    `Sitemap: ${site.url}/sitemap.xml`,
    "",
  ].join("\n");
}
