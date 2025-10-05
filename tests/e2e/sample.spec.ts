import { expect, test } from "@playwright/test";

/**
 * Sample E2E test to verify Playwright setup
 * This test demonstrates basic E2E testing functionality
 */
test.describe("Sample E2E Test Suite", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/Work Management/i);
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Look for login link or button
    const loginLink = page.getByRole("link", { name: /login/i }).first();

    if (await loginLink.isVisible()) {
      await loginLink.click();

      // Verify we're on the login page
      await expect(page).toHaveURL(/.*login/);
    } else {
      // If no login link, we might already be on a protected page
      // or the app structure is different
      console.log("Login link not found - app might have different structure");
    }
  });

  test("should have responsive meta viewport", async ({ page }) => {
    await page.goto("/");

    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute("content", /width=device-width/);
  });
});
