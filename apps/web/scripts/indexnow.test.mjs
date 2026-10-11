import { describe, expect, it } from "vitest";
import { changedUrls } from "./indexnow.mjs";

const sitemap = (entries) =>
  `<urlset>${entries.map(([loc, lastmod]) => `<url>\n<loc>${loc}</loc>\n<lastmod>${lastmod}</lastmod>\n</url>`).join("")}</urlset>`;

describe("changedUrls", () => {
  it("sends new pages and pages with a new lastmod, not unchanged or removed ones", () => {
    const before = sitemap([
      ["https://umnyaut.com/", "2026-10-10"],
      ["https://umnyaut.com/pol/", "2026-10-10"],
      ["https://umnyaut.com/old/", "2026-10-01"],
    ]);
    const after = sitemap([
      ["https://umnyaut.com/", "2026-10-11"],
      ["https://umnyaut.com/pol/", "2026-10-10"],
      ["https://umnyaut.com/pol/laminat/", "2026-10-11"],
    ]);
    expect(changedUrls(before, after)).toEqual(["https://umnyaut.com/", "https://umnyaut.com/pol/laminat/"]);
  });

  it("a first deploy (no old sitemap) sends everything", () => {
    expect(changedUrls("", sitemap([["https://umnyaut.com/", "2026-10-11"]]))).toEqual(["https://umnyaut.com/"]);
  });
});
