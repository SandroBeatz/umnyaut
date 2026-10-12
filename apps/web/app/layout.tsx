import { site } from "@umnyaut/catalog";
import { Toaster } from "@umnyaut/ui";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CookieBanner } from "@/features/cookie-consent";
import { Analytics } from "@/shared/analytics";
import { openGraph } from "@/shared/lib";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";
import { onest } from "./fonts";
import "./globals.css";

const title = `${site.name} — ${site.tagline.toLowerCase()}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: openGraph(title, site.description, "/"),
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-text">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        <CookieBanner />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
