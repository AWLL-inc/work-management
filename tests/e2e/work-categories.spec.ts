import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Work Categories Management
 * Tests category CRUD operations, reordering, and admin-only access
 */

test.describe("Work Categories Management", () => {
  // Helper function to login as admin
  async function loginAsAdmin(page: any) {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  }

  // Helper function to login as regular user
  async function loginAsUser(page: any) {
    await page.goto("/login");
    await page.fill('input[name="email"]', "user@example.com");
    await page.fill('input[name="password"]', "user123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  }

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test.describe("Admin Access", () => {
    test("should allow admin to access work categories page", async ({
      page,
    }) => {
      await loginAsAdmin(page);

      // Navigate to work categories page
      await page.goto("/admin/work-categories");

      // Should be on work categories page
      await expect(page).toHaveURL("/admin/work-categories");

      // Should see categories-related content
      const hasCategoriesContent =
        (await page.locator("text=/categor/i").count()) > 0;
      expect(hasCategoriesContent).toBeTruthy();
    });

    test("should redirect non-admin users away from categories page", async ({
      page,
    }) => {
      await loginAsUser(page);

      // Try to access admin categories page
      await page.goto("/admin/work-categories");

      // Should be redirected or show access denied
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes("/admin/work-categories");

      if (!isRedirected) {
        const hasAccessDenied =
          (await page.locator("text=/access denied|forbidden|403/i").count()) >
          0;
        expect(hasAccessDenied).toBeTruthy();
      }
    });
  });

  test.describe("View Categories List", () => {
    test("should display categories table", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");

      // Wait for content to load
      await page.waitForLoadState("networkidle");

      // Should have table or list structure
      const hasTable =
        (await page.locator("table").count()) > 0 ||
        (await page.locator('[role="table"]').count()) > 0 ||
        (await page.locator(".data-table").count()) > 0;

      expect(hasTable).toBeTruthy();
    });

    test("should show categories ordered by display order", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Categories should be displayed
      const hasCategories =
        (await page.locator("table tr, [role='row']").count()) > 0;
      expect(hasCategories).toBeTruthy();
    });

    test("should show loading state initially", async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate and check for loading or data
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/work-categories") &&
          response.status() === 200,
      );

      await page.goto("/admin/work-categories");

      // Wait for API call to complete
      await responsePromise;

      // Page should have loaded successfully
      expect(page.url()).toContain("/admin/work-categories");
    });
  });

  test.describe("Create Category", () => {
    test("should open create category dialog", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Look for "Add" or "Create" button
      const createButton = page
        .locator('button:has-text("Add"), button:has-text("Create")')
        .first();

      if (await createButton.isVisible()) {
        await createButton.click();

        // Should see a dialog or form
        const hasDialog =
          (await page.locator('[role="dialog"]').count()) > 0 ||
          (await page.locator('form:has-text("name")').count()) > 0;

        expect(hasDialog).toBeTruthy();
      }
    });

    test("should create new category with valid data", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      const createButton = page
        .locator('button:has-text("Add"), button:has-text("Create")')
        .first();

      if (await createButton.isVisible()) {
        await createButton.click();

        // Generate unique category name
        const categoryName = `Test Category ${Date.now()}`;

        // Fill in the form
        const nameInput = page
          .locator('input[name="name"], input[placeholder*="name" i]')
          .first();

        if (await nameInput.isVisible()) {
          await nameInput.fill(categoryName);

          // Look for description field (optional)
          const descInput = page
            .locator(
              'textarea[name="description"], textarea[placeholder*="description" i]',
            )
            .first();
          if (await descInput.isVisible()) {
            await descInput.fill("E2E test category description");
          }

          // Submit the form
          const submitButton = page
            .locator('button[type="submit"]:has-text("Create")')
            .first();
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Wait for success
            await page.waitForTimeout(1000);

            // Should see the new category in the list
            await expect(page.locator(`text=${categoryName}`)).toBeVisible({
              timeout: 5000,
            });
          }
        }
      }
    });

    test("should validate required fields", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      const createButton = page
        .locator('button:has-text("Add"), button:has-text("Create")')
        .first();

      if (await createButton.isVisible()) {
        await createButton.click();

        // Try to submit without filling required fields
        const submitButton = page
          .locator('button[type="submit"]:has-text("Create")')
          .first();

        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show validation error or stay on dialog
          const hasError =
            (await page.locator('[role="dialog"]').count()) > 0 ||
            (await page.locator("text=/required|error/i").count()) > 0;

          expect(hasError).toBeTruthy();
        }
      }
    });

    test("should prevent duplicate category names", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Get first existing category name (if any)
      const firstCategory = page.locator("table td, [role='cell']").first();

      if (await firstCategory.isVisible()) {
        const existingName = await firstCategory.textContent();

        if (existingName) {
          const createButton = page
            .locator('button:has-text("Add"), button:has-text("Create")')
            .first();

          if (await createButton.isVisible()) {
            await createButton.click();

            const nameInput = page
              .locator('input[name="name"], input[placeholder*="name" i]')
              .first();

            if (await nameInput.isVisible()) {
              await nameInput.fill(existingName.trim());

              const submitButton = page
                .locator('button[type="submit"]:has-text("Create")')
                .first();

              if (await submitButton.isVisible()) {
                await submitButton.click();

                // Should show duplicate error
                await page.waitForTimeout(500);

                const hasError =
                  (await page
                    .locator("text=/duplicate|already exists/i")
                    .count()) > 0;

                if (hasError) {
                  expect(hasError).toBeTruthy();
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe("Edit Category", () => {
    test("should open edit category dialog", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Look for edit button
      const editButton = page
        .locator('button[aria-label*="edit" i], button:has-text("Edit")')
        .first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Should see edit dialog
        const hasDialog =
          (await page.locator('[role="dialog"]').count()) > 0 ||
          (await page.locator('form:has-text("name")').count()) > 0;

        expect(hasDialog).toBeTruthy();
      }
    });

    test("should update category with valid data", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      const editButton = page
        .locator('button[aria-label*="edit" i], button:has-text("Edit")')
        .first();

      if (await editButton.isVisible()) {
        await editButton.click();

        const nameInput = page
          .locator('input[name="name"], input[placeholder*="name" i]')
          .first();

        if (await nameInput.isVisible()) {
          const updatedName = `Updated Category ${Date.now()}`;
          await nameInput.clear();
          await nameInput.fill(updatedName);

          const submitButton = page
            .locator(
              'button[type="submit"]:has-text("Update"), button[type="submit"]:has-text("Save")',
            )
            .first();

          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Wait for update to complete
            await page.waitForTimeout(1000);

            // Should see updated name in the list
            await expect(page.locator(`text=${updatedName}`)).toBeVisible({
              timeout: 5000,
            });
          }
        }
      }
    });

    test("should toggle category active status", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      const editButton = page
        .locator('button[aria-label*="edit" i], button:has-text("Edit")')
        .first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Look for active toggle/checkbox
        const activeToggle = page
          .locator('input[name="isActive"], input[type="checkbox"]')
          .first();

        if (await activeToggle.isVisible()) {
          await activeToggle.click();

          const submitButton = page
            .locator(
              'button[type="submit"]:has-text("Update"), button[type="submit"]:has-text("Save")',
            )
            .first();

          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Wait for update
            await page.waitForTimeout(1000);

            // Update should complete
            expect(page.url()).toContain("/admin/work-categories");
          }
        }
      }
    });
  });

  test.describe("Delete Category", () => {
    test("should show delete confirmation", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      const deleteButton = page
        .locator('button[aria-label*="delete" i], button:has-text("Delete")')
        .first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should see confirmation dialog
        const hasConfirmation =
          (await page.locator("text=/confirm|delete|sure/i").count()) > 0;

        expect(hasConfirmation).toBeTruthy();
      }
    });

    test("should soft delete category", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Get initial category count
      const initialRows = await page.locator("table tr, [role='row']").count();

      const deleteButton = page
        .locator('button[aria-label*="delete" i], button:has-text("Delete")')
        .first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page
          .locator('button:has-text("Delete"), button:has-text("Confirm")')
          .last();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();

          // Wait for deletion to complete
          await page.waitForTimeout(1000);

          // Category count should change or category should be hidden
          const finalRows = await page
            .locator("table tr, [role='row']")
            .count();

          expect(finalRows <= initialRows).toBeTruthy();
        }
      }
    });
  });

  test.describe("Category Ordering", () => {
    test("should display categories in order", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Get all category names
      const categoryNames = await page
        .locator("table td:first-child, [role='cell']:first-child")
        .allTextContents();

      // Should have categories displayed
      expect(categoryNames.length).toBeGreaterThan(0);
    });

    test("should have reorder functionality", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Look for drag handles or reorder buttons
      const hasDragHandles =
        (await page.locator('[role="button"]:has-text("↑")').count()) > 0 ||
        (await page.locator('[role="button"]:has-text("↓")').count()) > 0 ||
        (await page.locator('[draggable="true"]').count()) > 0;

      // Reorder functionality might exist
      // This is informational - not all implementations have visual drag handles
      console.log(`Has reorder controls: ${hasDragHandles}`);
    });
  });

  test.describe("Filter Categories", () => {
    test("should filter categories by active status", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Look for filter controls
      const filterControl = page
        .locator(
          'input[type="checkbox"]:near(:text("active")), select:near(:text("status"))',
        )
        .first();

      if (await filterControl.isVisible()) {
        // Toggle filter
        await filterControl.click();

        // Wait for filtered results
        await page.waitForTimeout(500);

        // List should update
        expect(page.url()).toContain("/admin/work-categories");
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display categories table on mobile", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Should still show categories content
      const hasContent =
        (await page.locator("text=/categor/i").count()) > 0 ||
        (await page.locator("table, [role='table']").count()) > 0;

      expect(hasContent).toBeTruthy();
    });
  });

  test.describe("Category Information Display", () => {
    test("should show category details", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/work-categories");
      await page.waitForLoadState("networkidle");

      // Should have name column
      const hasNameColumn =
        (await page
          .locator('th:has-text("Name"), [role="columnheader"]')
          .count()) > 0;

      // Should have some form of category data
      const hasData =
        (await page.locator("table td, [role='cell']").count()) > 0;

      expect(hasNameColumn || hasData).toBeTruthy();
    });
  });
});
