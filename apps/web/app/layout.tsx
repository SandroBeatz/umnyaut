import { site } from "@umnyaut/catalog";
import { Toaster } from "@umnyaut/ui";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";
import { onest } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://umnyaut.com"),
  title: `${site.name} — ${site.tagline.toLowerCase()}`,
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "ru_RU", siteName: site.name },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-text">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
