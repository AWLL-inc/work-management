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
      include: [
        "lib/**/*.ts",
        "app/api/**/*.ts",
        "components/data-table/hooks/**/*.{ts,tsx}",
        "components/data-table/enhanced/**/*.{ts,tsx}",
        "components/features/**/search/*.tsx",
        "components/ui/badge.tsx",
        "components/ui/button.tsx",
        "components/ui/card.tsx",
        "components/ui/checkbox.tsx",
        "components/ui/combobox.tsx",
        "components/ui/dialog.tsx",
        "components/ui/form.tsx",
        "components/ui/input.tsx",
        "components/ui/label.tsx",
        "components/ui/scroll-area.tsx",
        "components/ui/textarea.tsx",
        "components/ui/tooltip.tsx",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/drizzle/**",
        "**/*.config.*",
        // Exclude types and complex UI components
        "**/types.ts",
        "**/types/**",
        "lib/auth.ts", // NextAuth config, tested via integration
        "lib/server-actions.ts", // Server actions, tested via E2E
        "lib/api/client.ts", // Client-side API wrapper
        "lib/api/teams.ts", // Client-side API wrapper
        "lib/api/users.ts", // Client-side API wrapper
        "lib/constants/**", // Constants don't need testing
        "lib/hooks/**", // React hooks tested via component tests
        "lib/services/email.ts", // Email service, tested via integration
        "lib/db/repositories/team-repository.ts", // Repository tested via API tests
        "lib/db/repositories/work-category-repository.ts", // Repository tested via API tests
        "lib/db/repositories/work-log-repository.ts", // Repository tested via API tests
        "lib/utils/work-log-utils.ts", // Utility tested via integration
        "lib/validations/common.ts", // Validation schemas tested via API tests
        "lib/validations/form-validations.ts", // Form validation tested via component tests
        // Exclude page components and layouts
        "app/**/page.tsx",
        "app/**/layout.tsx",
        "app/api/openapi/**", // OpenAPI spec generation
        "app/api/dashboard/personal/**", // Dashboard endpoints tested via integration
        "app/api/dashboard/projects/**", // Dashboard endpoints tested via integration
        "app/api/dashboard/team/**", // Dashboard endpoints tested via integration
        // Exclude complex UI components without tests
        "components/auth/**",
        "components/layout/**",
        "components/providers/**",
        "components/ui/dropdown-menu.tsx",
        "components/ui/empty-state.tsx",
        "components/ui/insights-dialog.tsx",
        "components/ui/live-region.tsx",
        "components/ui/password-input.tsx",
        "components/ui/popover.tsx",
        "components/ui/rich-text-editor.tsx",
        "components/ui/select.tsx",
        "components/ui/spinner.tsx",
        "components/ui/table.tsx",
        "components/ui/tabs.tsx",
        "components/ui/user-combobox.tsx",
        // Exclude feature components without dedicated tests
        "components/features/**/admin/**",
        "components/features/**/dashboard/**",
        "components/features/**/work-logs/*-table.tsx",
        "components/features/**/work-logs/*-dialog.tsx",
        "components/features/**/work-logs/*-columns.tsx",
        "components/features/**/work-logs/*-editor.tsx",
      ],
      thresholds: {
        lines: 71,
        functions: 80,
        branches: 92,
        statements: 71,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
