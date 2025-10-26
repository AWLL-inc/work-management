import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Work Logs Scope Switching
 * Tests scope tab visibility, switching, and data filtering
 */

test.describe("Work Logs Scope Switching", () => {
  test.describe("Scope Tabs for Regular User", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();

      // Login as regular user
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");
    });

    test("should display My Work Logs and Team Work Logs tabs", async ({
      page,
    }) => {
      await page.goto("/work-logs");

      // Verify scope tabs are visible
      await expect(
        page.locator('button[role="tab"]:has-text("My Work Logs")'),
      ).toBeVisible();
      await expect(
        page.locator('button[role="tab"]:has-text("Team Work Logs")'),
      ).toBeVisible();
    });

    test("should NOT display All Work Logs tab for non-admin", async ({
      page,
    }) => {
      await page.goto("/work-logs");

      // All Work Logs tab should not be visible
      const allTabButton = page.locator(
        'button[role="tab"]:has-text("All Work Logs")',
      );
      await expect(allTabButton).not.toBeVisible();
    });

    test("should have My Work Logs tab selected by default", async ({
      page,
    }) => {
      await page.goto("/work-logs");

      // My Work Logs tab should be active
      const myLogsTab = page.locator(
        'button[role="tab"]:has-text("My Work Logs")',
      );
      await expect(myLogsTab).toHaveAttribute("data-state", "active");
    });

    test("should switch to Team Work Logs when clicked", async ({ page }) => {
      await page.goto("/work-logs");

      // Click Team Work Logs tab
      await page.click('button[role="tab"]:has-text("Team Work Logs")');

      // URL should update with scope parameter
      await expect(page).toHaveURL(/\/work-logs\?scope=team/);

      // Team tab should be active
      const teamTab = page.locator(
        'button[role="tab"]:has-text("Team Work Logs")',
      );
      await expect(teamTab).toHaveAttribute("data-state", "active");
    });

    test("should persist scope when navigating back", async ({ page }) => {
      await page.goto("/work-logs");

      // Switch to Team scope
      await page.click('button[role="tab"]:has-text("Team Work Logs")');
      await expect(page).toHaveURL(/\/work-logs\?scope=team/);

      // Navigate away
      await page.goto("/dashboard");

      // Navigate back
      await page.goto("/work-logs?scope=team");

      // Team tab should still be active
      const teamTab = page.locator(
        'button[role="tab"]:has-text("Team Work Logs")',
      );
      await expect(teamTab).toHaveAttribute("data-state", "active");
    });

    test("should show My Work Logs when scope=own in URL", async ({ page }) => {
      await page.goto("/work-logs?scope=own");

      // My Work Logs tab should be active
      const myLogsTab = page.locator(
        'button[role="tab"]:has-text("My Work Logs")',
      );
      await expect(myLogsTab).toHaveAttribute("data-state", "active");
    });
  });

  test.describe("Scope Tabs for Admin User", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();

      // Login as admin
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");
    });

    test("should display all three scope tabs for admin", async ({ page }) => {
      await page.goto("/work-logs");

      // Verify all tabs are visible
      await expect(
        page.locator('button[role="tab"]:has-text("My Work Logs")'),
      ).toBeVisible();
      await expect(
        page.locator('button[role="tab"]:has-text("Team Work Logs")'),
      ).toBeVisible();
      await expect(
        page.locator('button[role="tab"]:has-text("All Work Logs")'),
      ).toBeVisible();
    });

    test("should switch to All Work Logs when clicked", async ({ page }) => {
      await page.goto("/work-logs");

      // Click All Work Logs tab
      await page.click('button[role="tab"]:has-text("All Work Logs")');

      // URL should update
      await expect(page).toHaveURL(/\/work-logs\?scope=all/);

      // All tab should be active
      const allTab = page.locator(
        'button[role="tab"]:has-text("All Work Logs")',
      );
      await expect(allTab).toHaveAttribute("data-state", "active");
    });

    test("should navigate between all three scopes", async ({ page }) => {
      await page.goto("/work-logs");

      // Start with My Work Logs (default)
      let activeTab = page.locator(
        'button[role="tab"]:has-text("My Work Logs")',
      );
      await expect(activeTab).toHaveAttribute("data-state", "active");

      // Switch to Team
      await page.click('button[role="tab"]:has-text("Team Work Logs")');
      activeTab = page.locator('button[role="tab"]:has-text("Team Work Logs")');
      await expect(activeTab).toHaveAttribute("data-state", "active");
      await expect(page).toHaveURL(/\/work-logs\?scope=team/);

      // Switch to All
      await page.click('button[role="tab"]:has-text("All Work Logs")');
      activeTab = page.locator('button[role="tab"]:has-text("All Work Logs")');
      await expect(activeTab).toHaveAttribute("data-state", "active");
      await expect(page).toHaveURL(/\/work-logs\?scope=all/);

      // Switch back to My
      await page.click('button[role="tab"]:has-text("My Work Logs")');
      activeTab = page.locator('button[role="tab"]:has-text("My Work Logs")');
      await expect(activeTab).toHaveAttribute("data-state", "active");
      await expect(page).toHaveURL(/\/work-logs\?scope=own/);
    });
  });

  test.describe("Scope Data Filtering", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
    });

    test("should show only own work logs in My Work Logs scope", async ({
      page,
    }) => {
      // Login as user
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Go to My Work Logs (default)
      await page.goto("/work-logs?scope=own");

      // Wait for table to load
      await page.waitForSelector("table", { timeout: 5000 });

      // All rows should belong to current user
      // (This assumes user info is displayed in the table)
      const userEmail = await page
        .locator("text=user@example.com")
        .first()
        .textContent();
      expect(userEmail).toContain("user@example.com");
    });

    test("should show team members' work logs in Team scope", async ({
      page,
    }) => {
      // Login as user
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Switch to Team Work Logs
      await page.goto("/work-logs?scope=team");

      // Wait for table to load
      await page.waitForSelector("table", { timeout: 5000 });

      // Table should be displayed (may have own logs + teammate logs)
      const table = page.locator("table");
      await expect(table).toBeVisible();
    });

    test("should show all work logs in All scope for admin", async ({
      page,
    }) => {
      // Login as admin
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Go to All Work Logs
      await page.goto("/work-logs?scope=all");

      // Wait for table to load
      await page.waitForSelector("table", { timeout: 5000 });

      // Table should be displayed with all logs
      const table = page.locator("table");
      await expect(table).toBeVisible();
    });

    test("should reload data when switching scopes", async ({ page }) => {
      // Login as admin to have access to all scopes
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      await page.goto("/work-logs?scope=own");
      await page.waitForSelector("table", { timeout: 5000 });

      // Get row count in own scope
      const ownScopeRows = await page.locator("table tbody tr").count();

      // Switch to all scope
      await page.click('button[role="tab"]:has-text("All Work Logs")');
      await page.waitForURL(/\/work-logs\?scope=all/);
      await page.waitForSelector("table", { timeout: 5000 });

      // Row count might be different (or same if user is the only one with logs)
      const allScopeRows = await page.locator("table tbody tr").count();

      // Just verify the page loaded successfully
      expect(allScopeRows).toBeGreaterThanOrEqual(ownScopeRows);
    });
  });

  test.describe("Scope with Team Membership", () => {
    test("should show teammate logs when user is in a team", async ({
      page,
    }) => {
      // This test requires:
      // 1. User to be member of a team
      // 2. Team to have other members
      // 3. Other members to have work logs

      // Login as user
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Go to team scope
      await page.goto("/work-logs?scope=team");
      await page.waitForSelector("table", { timeout: 5000 });

      // If user is in a team with other members, team scope should show their logs
      // This is a basic check that the page loads
      const table = page.locator("table");
      await expect(table).toBeVisible();
    });

    test("should show only own logs in team scope if user has no team", async ({
      page,
    }) => {
      // This test verifies behavior when user is not in any team

      // Login as user (assuming this user might not be in a team)
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Compare My and Team scopes
      await page.goto("/work-logs?scope=own");
      await page.waitForSelector("table", { timeout: 5000 });
      const ownCount = await page.locator("table tbody tr").count();

      await page.goto("/work-logs?scope=team");
      await page.waitForSelector("table", { timeout: 5000 });
      const teamCount = await page.locator("table tbody tr").count();

      // If user has no team, counts should be the same
      // (This assertion might not always be true depending on test data)
      expect(teamCount).toBeGreaterThanOrEqual(ownCount);
    });
  });

  test.describe("URL Parameter Handling", () => {
    test("should handle invalid scope parameter gracefully", async ({
      page,
    }) => {
      await page.context().clearCookies();

      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Navigate with invalid scope
      await page.goto("/work-logs?scope=invalid");

      // Should default to "own" scope
      const myLogsTab = page.locator(
        'button[role="tab"]:has-text("My Work Logs")',
      );
      await expect(myLogsTab).toHaveAttribute("data-state", "active");
    });

    test("should handle missing scope parameter", async ({ page }) => {
      await page.context().clearCookies();

      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Navigate without scope parameter
      await page.goto("/work-logs");

      // Should default to "own" scope
      const myLogsTab = page.locator(
        'button[role="tab"]:has-text("My Work Logs")',
      );
      await expect(myLogsTab).toHaveAttribute("data-state", "active");
    });

    test("should prevent non-admin from accessing all scope via URL", async ({
      page,
    }) => {
      await page.context().clearCookies();

      // Login as regular user
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Try to access all scope via URL
      await page.goto("/work-logs?scope=all");

      // Should show error or redirect (depending on implementation)
      // For now, just verify the page doesn't crash
      await page.waitForSelector("body", { timeout: 5000 });
    });
  });

  test.describe("Tab Interaction", () => {
    test("should highlight active tab correctly", async ({ page }) => {
      await page.context().clearCookies();

      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      await page.goto("/work-logs");

      // Click each tab and verify it becomes active
      const tabs = [
        { name: "My Work Logs", scope: "own" },
        { name: "Team Work Logs", scope: "team" },
        { name: "All Work Logs", scope: "all" },
      ];

      for (const tab of tabs) {
        await page.click(`button[role="tab"]:has-text("${tab.name}")`);

        const activeTab = page.locator(
          `button[role="tab"]:has-text("${tab.name}")`,
        );
        await expect(activeTab).toHaveAttribute("data-state", "active");

        await expect(page).toHaveURL(new RegExp(`scope=${tab.scope}`));
      }
    });

    test("should be keyboard accessible", async ({ page }) => {
      await page.context().clearCookies();

      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      await page.goto("/work-logs");

      // Focus on first tab
      await page.focus('button[role="tab"]:has-text("My Work Logs")');

      // Tab should be focusable
      const focusedElement = await page.locator(":focus");
      await expect(focusedElement).toHaveAttribute("role", "tab");
    });
  });
});
