import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  // This creates a minimal .next/standalone directory
  output: "standalone",

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

export default withNextIntl(nextConfig);
