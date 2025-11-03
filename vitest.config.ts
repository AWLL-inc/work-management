import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {}, // Use empty PostCSS config in tests
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/e2e/**", // Exclude Playwright E2E tests
      "**/*.spec.ts", // Exclude Playwright spec files
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.ts", "app/api/**/*.ts", "components/**/*.tsx"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/drizzle/**",
        "**/*.config.*",
      ],
      // Global thresholds disabled - use per-file thresholds instead
      // thresholds: {
      //   lines: 95,
      //   functions: 95,
      //   branches: 95,
      //   statements: 95,
      // },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
