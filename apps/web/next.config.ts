import { redirects } from "@umnyaut/catalog";
import type { NextConfig } from "next";
import { securityHeaders } from "./security-headers";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  reactCompiler: true,
  poweredByHeader: false,
  transpilePackages: ["@umnyaut/calc", "@umnyaut/catalog", "@umnyaut/ui"],
  async headers() {
    // File names under /img carry a content hash (apps/web/scripts/images.mjs), so they never change.
    return [
      // Dev needs eval for fast refresh, so the policy applies to production builds only.
      ...(process.env.NODE_ENV === "production" ? [{ source: "/:path*", headers: securityHeaders() }] : []),
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  async redirects() {
    return redirects.map(({ from, to }) => ({ source: from, destination: to, permanent: true }));
  },
};

export default nextConfig;
