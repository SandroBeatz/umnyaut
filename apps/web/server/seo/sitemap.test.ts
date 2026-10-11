import "server-only";
import { navigation, site, toolPath, tools } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { loadPageContent } from "../content";
import { robotsTxt, sitemapEntries } from "./sitemap";

describe("sitemap", () => {
  const entries = sitemapEntries();
  const urls = entries.map((e) => e.url);

  it("lists home, every live tool and only approved info pages", () => {
    expect(urls[0]).toBe(`${site.url}/`);
    for (const tool of tools) {
      expect(urls.includes(`${site.url}${toolPath(tool)}`), tool.id).toBe(tool.status === "live");
    }
    for (const { href } of navigation.infoPages) {
      const draft = loadPageContent(href.replaceAll("/", "")).frontmatter.draft;
      expect(urls.includes(`${site.url}${href}`), href).toBe(!draft);
    }
  });

  it("has unique absolute URLs with a trailing slash and a date", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\/umnyaut\.com\/([a-z0-9-]+\/)*$/);
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("robots.txt", () => {
  it("closes only /api/, cleans `s` for Yandex and names the sitemap", () => {
    const text = robotsTxt();
    expect(text.match(/^Disallow: .*$/gm)).toEqual(["Disallow: /api/", "Disallow: /api/"]);
    expect(text).toContain("Clean-param: s");
    expect(text).toContain(`Sitemap: ${site.url}/sitemap.xml`);
  });
});
