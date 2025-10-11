import type { NextConfig } from "next";

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
  },
};

export default nextConfig;
