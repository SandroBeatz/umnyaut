import { isProduction } from "@server/platform/env";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevUiPage } from "@/views/dev-ui";

// Rendered per request so prod (APP_ENV=production at runtime) answers 404.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "UI", robots: { index: false, follow: false } };

export default function Page() {
  if (isProduction()) notFound();
  return <DevUiPage />;
}
