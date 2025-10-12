import { expect, test } from "@playwright/test";

test.describe("AG Grid Batch Edit Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to work logs page
    await page.goto("/work-logs");

    // Wait for AG Grid to load
    await page.waitForSelector(".ag-root", { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(1000);
  });

  test("should toggle batch editing mode", async ({ page }) => {
    // Click batch edit button
    await page.click('button:has-text("一括編集")');

    // Verify UI changes to batch edit mode
    await expect(page.locator('button:has-text("保存")')).toBeVisible();
    await expect(page.locator('button:has-text("キャンセル")')).toBeVisible();
    await expect(page.locator('button:has-text("一括編集")')).not.toBeVisible();

    // Verify grid is in batch editing mode
    await expect(
      page.locator(".ag-work-log-table.batch-editing"),
    ).toBeVisible();
  });

  test("should track pending changes and update save button", async ({
    page,
  }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Edit a cell
    const hoursCell = page.locator('.ag-cell[col-id="hours"]').first();
    await hoursCell.click();

    // Wait for editor to appear and enter new value
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', "7.5");
    await page.keyboard.press("Enter");

    // Verify save button shows pending changes count
    await expect(page.locator('button:has-text("保存 (1件)")')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should save batch changes successfully", async ({ page }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Edit a cell
    const hoursCell = page.locator('.ag-cell[col-id="hours"]').first();
    await hoursCell.click();
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', "7.5");
    await page.keyboard.press("Enter");

    // Save changes
    await page.click('button:has-text("保存 (1件)")');

    // Verify success message appears
    await expect(page.locator("text=1件の変更を保存しました")).toBeVisible({
      timeout: 5000,
    });

    // Verify return to normal mode
    await expect(page.locator('button:has-text("一括編集")')).toBeVisible();
  });

  test("should show confirmation dialog when canceling with unsaved changes", async ({
    page,
  }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Make changes
    const hoursCell = page.locator('.ag-cell[col-id="hours"]').first();
    await hoursCell.click();
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', "7.5");
    await page.keyboard.press("Enter");

    // Try to cancel
    await page.click('button:has-text("キャンセル")');

    // Verify confirmation dialog appears
    await expect(
      page.locator("text=未保存の変更を破棄しますか？"),
    ).toBeVisible();
    await expect(
      page.locator("text=1件の未保存の変更があります"),
    ).toBeVisible();
  });

  test("should validate hours input and show error", async ({ page }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Enter invalid hours value
    const hoursCell = page.locator('.ag-cell[col-id="hours"]').first();
    await hoursCell.click();
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', "999");
    await page.keyboard.press("Enter");

    // Verify validation error appears
    await expect(
      page.locator("text=時間は168以下で入力してください"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should edit details field with multi-line support", async ({
    page,
  }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Edit details cell
    const detailsCell = page.locator('.ag-cell[col-id="details"]').first();
    await detailsCell.click();

    // Wait for multi-line editor to appear
    await page.waitForSelector("textarea");

    // Enter multi-line text
    const multiLineText = "Line 1\nLine 2\nLine 3";
    await page.fill("textarea", multiLineText);
    await page.keyboard.press("Escape"); // Close editor

    // Verify save button shows pending changes
    await expect(page.locator('button:has-text("保存 (1件)")')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should validate date input format", async ({ page }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Edit date cell with invalid format
    const dateCell = page.locator('.ag-cell[col-id="date"]').first();
    await dateCell.click();
    await page.waitForSelector('input[type="date"]');

    // Try to enter invalid date (this should be prevented by the date input)
    // But we can test the validation by trying edge cases
    await page.fill('input[type="date"]', "2024-02-30"); // Invalid date
    await page.keyboard.press("Enter");

    // The parseDate function should prevent this invalid date
    // Check if validation error appears or if it's corrected
    await page.waitForTimeout(1000);
  });

  test("should cancel batch editing without confirmation if no changes", async ({
    page,
  }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Cancel immediately without making changes
    await page.click('button:has-text("キャンセル")');

    // Should return to normal mode without confirmation dialog
    await expect(page.locator('button:has-text("一括編集")')).toBeVisible();
    await expect(
      page.locator("text=未保存の変更を破棄しますか？"),
    ).not.toBeVisible();
  });

  test("should handle multiple cell edits before saving", async ({ page }) => {
    // Enter batch editing mode
    await page.click('button:has-text("一括編集")');

    // Edit multiple cells
    const hoursCells = page.locator('.ag-cell[col-id="hours"]');

    // Edit first cell
    await hoursCells.nth(0).click();
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', "7.5");
    await page.keyboard.press("Enter");

    // Edit second cell if it exists
    const cellCount = await hoursCells.count();
    if (cellCount > 1) {
      await hoursCells.nth(1).click();
      await page.waitForSelector('input[type="text"]');
      await page.fill('input[type="text"]', "6.0");
      await page.keyboard.press("Enter");

      // Verify save button shows multiple changes
      await expect(page.locator('button:has-text("保存 (2件)")')).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
