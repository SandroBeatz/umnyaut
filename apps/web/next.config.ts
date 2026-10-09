import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  reactCompiler: true,
  poweredByHeader: false,
  transpilePackages: ["@umnyaut/calc", "@umnyaut/catalog", "@umnyaut/ui"],
  async headers() {
    // File names under /img carry a content hash (apps/web/scripts/images.mjs), so they never change.
    return [
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
