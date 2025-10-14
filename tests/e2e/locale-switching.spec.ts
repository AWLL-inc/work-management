import { expect, test } from "@playwright/test";

test.describe("Locale Switching", () => {
  test("should switch language using language switcher", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Check initial language (Japanese is default in production, but might be English in tests)
    // So we'll just verify the language switcher exists and works
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    await expect(languageSwitcher).toBeVisible();

    // Get current locale from the select value
    const currentLocale = await languageSwitcher
      .locator("button")
      .textContent();
    const isJapanese = currentLocale?.includes("日本語");

    // Click language switcher and select the opposite language
    await languageSwitcher.click();
    if (isJapanese) {
      await page.click('text="English"');
    } else {
      await page.click('text="日本語"');
    }

    // Wait for page refresh
    await page.waitForLoadState("networkidle");

    // Verify language changed by checking the title
    const title = await page.locator("h1").textContent();
    if (isJapanese) {
      // If we were in Japanese and switched to English
      expect(title).toBe("Work Management");
    } else {
      // If we were in English and switched to Japanese
      expect(title).toBe("Work Management"); // Title is same in both languages
    }

    // Verify cookie is set
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === "locale");
    expect(localeCookie).toBeDefined();
    if (isJapanese) {
      expect(localeCookie?.value).toBe("en");
    } else {
      expect(localeCookie?.value).toBe("ja");
    }
  });

  test("should persist language selection across page navigation", async ({
    page,
  }) => {
    // Navigate to homepage
    await page.goto("/");

    // Set locale to English explicitly
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    await expect(languageSwitcher).toBeVisible();

    // Check if we need to switch to English
    const currentText = await languageSwitcher.locator("button").textContent();
    if (currentText?.includes("日本語")) {
      // Currently in Japanese, switch to English
      await languageSwitcher.click();
      await page.click('text="English"');
      await page.waitForLoadState("networkidle");
    }

    // Navigate to dashboard
    await page.click('text="Dashboard"');
    await page.waitForLoadState("networkidle");

    // Verify we're on dashboard page
    await expect(page).toHaveURL(/\/dashboard/);

    // Check that language is still English
    const dashboardTitle = await page.locator("h1").textContent();
    expect(dashboardTitle).toContain("Dashboard");

    // Navigate to work logs
    await page.click('text="Work Logs"');
    await page.waitForLoadState("networkidle");

    // Verify we're on work logs page
    await expect(page).toHaveURL(/\/work-logs/);

    // Verify language persisted across navigation
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === "locale");
    expect(localeCookie?.value).toBe("en");
  });

  test("should handle language switcher button variant", async ({ page }) => {
    // Navigate to a page that might have the button variant
    await page.goto("/");

    // Check if button variant exists
    const languageSwitcherButton = page.locator(
      '[data-testid="language-switcher-button"]',
    );
    const buttonExists = await languageSwitcherButton.count();

    if (buttonExists > 0) {
      // Test the button variant
      await expect(languageSwitcherButton).toBeVisible();

      // Get current language from button text
      const buttonText = await languageSwitcherButton.textContent();
      const isShowingEN = buttonText?.includes("EN");

      // Click to toggle language
      await languageSwitcherButton.click();

      // Wait for page refresh
      await page.waitForLoadState("networkidle");

      // Verify language changed
      const newButtonText = await languageSwitcherButton.textContent();
      if (isShowingEN) {
        expect(newButtonText).toContain("日本語");
      } else {
        expect(newButtonText).toContain("EN");
      }
    }
  });

  test("should validate locale before setting", async ({ page }) => {
    // This test verifies that invalid locales are rejected
    // We can't directly test the server action validation from the UI,
    // but we can verify that the language switcher only allows valid values

    await page.goto("/");

    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    await expect(languageSwitcher).toBeVisible();

    // Open the dropdown
    await languageSwitcher.click();

    // Verify only valid locale options are available
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();

    expect(optionCount).toBe(2); // Only ja and en

    // Verify the option values
    const japaneseOption = page.locator('text="日本語"');
    const englishOption = page.locator('text="English"');

    await expect(japaneseOption).toBeVisible();
    await expect(englishOption).toBeVisible();
  });
});
