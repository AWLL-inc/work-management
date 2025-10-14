import { expect, test } from "@playwright/test";

test.describe("Work Logs Search Performance", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to work logs page
    await page.goto("/dashboard/work-logs");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Verify we're on the right page
    await expect(page.locator("h1")).toContainText("作業ログ管理");
  });

  test("should load initial data within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    // Wait for the table to be visible and populated
    await page.waitForSelector('[role="gridcell"]', { timeout: 10000 });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Initial load should be within 3 seconds
    expect(duration).toBeLessThan(3000);
    console.log(`Initial load completed in ${duration}ms`);
  });

  test("should perform date range search within 1 second", async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[role="gridcell"]');

    const startTime = Date.now();

    // Fill in date range
    await page.fill('input[type="date"]', "2024-01-01");
    await page.locator('input[type="date"]').nth(1).fill("2024-12-31");

    // Click apply button
    await page.click('button:has-text("適用")');

    // Wait for table update
    await page.waitForLoadState("networkidle");

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000);
    console.log(`Date range search completed in ${duration}ms`);
  });

  test("should handle multiple filter conditions efficiently", async ({
    page,
  }) => {
    // Wait for initial load
    await page.waitForSelector('[role="gridcell"]');

    const startTime = Date.now();

    // Apply multiple filters
    await page.fill('input[type="date"]', "2024-01-01");
    await page.locator('input[type="date"]').nth(1).fill("2024-12-31");

    // Select projects (assuming there are project filter controls)
    const projectCombobox = page.locator('[role="combobox"]').first();
    if ((await projectCombobox.count()) > 0) {
      await projectCombobox.click();

      // Select first available option
      const firstOption = page.locator('[role="option"]').first();
      if ((await firstOption.count()) > 0) {
        await firstOption.click();
      }
    }

    // Apply filters
    await page.click('button:has-text("適用")');

    // Wait for results
    await page.waitForLoadState("networkidle");

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1500);
    console.log(`Multiple filter search completed in ${duration}ms`);
  });

  test("should handle search text filtering efficiently", async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[role="gridcell"]');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="検索"]');

    if ((await searchInput.count()) > 0) {
      const startTime = Date.now();

      // Type search text
      await searchInput.fill("会議");

      // Apply search
      await page.click('button:has-text("適用")');

      // Wait for results
      await page.waitForLoadState("networkidle");

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
      console.log(`Text search completed in ${duration}ms`);
    }
  });

  test("should clear filters quickly", async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[role="gridcell"]');

    // Apply some filters first
    await page.fill('input[type="date"]', "2024-01-01");
    await page.click('button:has-text("適用")');
    await page.waitForLoadState("networkidle");

    const startTime = Date.now();

    // Clear filters
    await page.click('button:has-text("クリア")');

    // Wait for results
    await page.waitForLoadState("networkidle");

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500);
    console.log(`Filter clear completed in ${duration}ms`);
  });

  test("should handle pagination efficiently", async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[role="gridcell"]');

    // Check if pagination exists
    const nextButton = page.locator('button[aria-label*="次"]');

    if ((await nextButton.count()) > 0 && (await nextButton.isEnabled())) {
      const startTime = Date.now();

      // Navigate to next page
      await nextButton.click();

      // Wait for page update
      await page.waitForLoadState("networkidle");

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(800);
      console.log(`Pagination completed in ${duration}ms`);
    }
  });

  test("should maintain performance with active filters summary", async ({
    page,
  }) => {
    // Wait for initial load
    await page.waitForSelector('[role="gridcell"]');

    const startTime = Date.now();

    // Apply multiple filters to trigger summary display
    await page.fill('input[type="date"]', "2024-01-01");
    await page.locator('input[type="date"]').nth(1).fill("2024-12-31");

    // Apply filters
    await page.click('button:has-text("適用")');

    // Wait for results and active filters to display
    await page.waitForLoadState("networkidle");

    // Check that active filters summary is displayed
    const activeFiltersSection = page.locator("text=適用中のフィルター");
    if ((await activeFiltersSection.count()) > 0) {
      await expect(activeFiltersSection).toBeVisible();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1200);
    console.log(`Filters with summary display completed in ${duration}ms`);
  });

  test("should handle responsive design performance", async ({ page }) => {
    // Test mobile viewport performance
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();

    // Reload page in mobile view
    await page.reload();
    await page.waitForSelector('[role="gridcell"]');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(4000);
    console.log(`Mobile view load completed in ${duration}ms`);

    // Test tablet viewport performance
    await page.setViewportSize({ width: 768, height: 1024 });

    const tabletStartTime = Date.now();

    // Apply a filter in tablet view
    await page.fill('input[type="date"]', "2024-01-01");
    await page.click('button:has-text("適用")');
    await page.waitForLoadState("networkidle");

    const tabletEndTime = Date.now();
    const tabletDuration = tabletEndTime - tabletStartTime;

    expect(tabletDuration).toBeLessThan(1500);
    console.log(`Tablet view filter completed in ${tabletDuration}ms`);
  });

  test("should handle concurrent filter operations", async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[role="gridcell"]');

    const startTime = Date.now();

    // Perform multiple filter operations quickly in succession
    await Promise.all([
      page.fill('input[type="date"]', "2024-01-01"),
      page.locator('input[type="date"]').nth(1).fill("2024-12-31"),
    ]);

    // Apply filters
    await page.click('button:has-text("適用")');

    // Wait for final result
    await page.waitForLoadState("networkidle");

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000);
    console.log(`Concurrent filter operations completed in ${duration}ms`);
  });

  test("should measure search controls rendering performance", async ({
    page,
  }) => {
    const startTime = Date.now();

    // Navigate to page and measure search controls render time
    await page.goto("/dashboard/work-logs");

    // Wait for search controls to be fully rendered
    await page.waitForSelector('button:has-text("適用")');
    await page.waitForSelector('button:has-text("クリア")');
    await page.waitForSelector('input[type="date"]');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000);
    console.log(`Search controls rendering completed in ${duration}ms`);
  });
});
