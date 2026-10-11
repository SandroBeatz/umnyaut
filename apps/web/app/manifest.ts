import { site } from "@umnyaut/catalog";
import type { MetadataRoute } from "next";

/** Install metadata; icons from `pnpm --filter web brand-images` (content plan G08). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline.toLowerCase()}`,
    short_name: site.name,
    description: site.description,
    lang: "ru",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
