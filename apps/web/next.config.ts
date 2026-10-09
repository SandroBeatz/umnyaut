import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  reactCompiler: true,
  poweredByHeader: false,
  transpilePackages: ["@umnyaut/calc", "@umnyaut/catalog", "@umnyaut/ui"],
};

export default nextConfig;
