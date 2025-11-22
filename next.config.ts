import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds only
  // This creates a minimal .next/standalone directory
  // Disabled in development to avoid Windows symlink permission issues
  ...(process.env.NODE_ENV === "production" &&
  process.env.DOCKER_BUILD === "true"
    ? { output: "standalone" }
    : {}),

  // Transpile CSS from external packages
  transpilePackages: ["ag-grid-community", "ag-grid-react"],

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Enable React Compiler for automatic memoization
    reactCompiler: true,
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
