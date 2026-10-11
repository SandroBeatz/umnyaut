import { site } from "@umnyaut/catalog";

/** One shared social image at launch (content plan G09); per-tool images come later. */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630 } as const;

/**
 * Open Graph of a page. Next replaces the layout's `openGraph` as a whole, so every page passes the full
 * object: its own title, description and URL plus the shared image.
 */
export function openGraph(title: string, description: string, path: string) {
  return {
    type: "website" as const,
    locale: "ru_RU",
    siteName: site.name,
    title,
    description,
    url: path,
    images: [OG_IMAGE],
  };
}

const absolute = (path: string) => `${site.url}${path}`;
/** FAQ answers are sanitised HTML; structured data gets the plain text. */
const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

export interface LdCrumb {
  name: string;
  path: string;
}

/** Schema.org JSON-LD (docs/business/seo-and-analytics.md → Technical SEO). */
export const ld = {
  breadcrumbs: (crumbs: readonly LdCrumb[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  }),
  faq: (faq: readonly { q: string; a: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: plain(q),
      acceptedAnswer: { "@type": "Answer", text: plain(a) },
    })),
  }),
  tool: ({ name, description, path }: { name: string; description: string; path: string }) => ({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: absolute(path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    inLanguage: "ru",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
  }),
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: absolute("/"),
    logo: absolute("/icon-512.png"),
  }),
  website: () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: absolute("/"),
    inLanguage: "ru",
  }),
};
