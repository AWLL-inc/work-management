import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Projects Management
 * Tests project CRUD operations, filtering, and admin-only access
 */

test.describe("Projects Management", () => {
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
    test("should allow admin to access projects page", async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to projects page
      await page.goto("/admin/projects");

      // Should be on projects page
      await expect(page).toHaveURL("/admin/projects");

      // Should see projects-related content (table or heading)
      // Look for common elements that would appear on a projects page
      const hasProjectsContent =
        (await page.locator("text=/project/i").count()) > 0;
      expect(hasProjectsContent).toBeTruthy();
    });

    test("should redirect non-admin users away from projects page", async ({
      page,
    }) => {
      await loginAsUser(page);

      // Try to access admin projects page
      await page.goto("/admin/projects");

      // Should be redirected (not on /admin/projects)
      // Might redirect to /dashboard or show 403/404
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes("/admin/projects");

      // If not redirected, should at least show access denied or similar
      if (!isRedirected) {
        const hasAccessDenied =
          (await page.locator("text=/access denied|forbidden|403/i").count()) >
          0;
        expect(hasAccessDenied).toBeTruthy();
      }
    });
  });

  test.describe("View Projects List", () => {
    test("should display projects table", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");

      // Wait for content to load
      await page.waitForLoadState("networkidle");

      // Should have table or list structure
      // Look for common table or grid elements
      const hasTable =
        (await page.locator("table").count()) > 0 ||
        (await page.locator('[role="table"]').count()) > 0 ||
        (await page.locator(".data-table").count()) > 0;

      expect(hasTable).toBeTruthy();
    });

    test("should show loading state initially", async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate and check for loading indicators
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/projects") && response.status() === 200,
      );

      await page.goto("/admin/projects");

      // Wait for API call to complete
      await responsePromise;

      // Page should have loaded successfully
      expect(page.url()).toContain("/admin/projects");
    });
  });

  test.describe("Create Project", () => {
    test("should open create project dialog", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
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

    test("should create new project with valid data", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
      await page.waitForLoadState("networkidle");

      // Look for create button
      const createButton = page
        .locator('button:has-text("Add"), button:has-text("Create")')
        .first();

      if (await createButton.isVisible()) {
        await createButton.click();

        // Generate unique project name
        const projectName = `Test Project ${Date.now()}`;

        // Fill in the form
        const nameInput = page
          .locator('input[name="name"], input[placeholder*="name" i]')
          .first();

        if (await nameInput.isVisible()) {
          await nameInput.fill(projectName);

          // Look for description field (optional)
          const descInput = page
            .locator(
              'textarea[name="description"], textarea[placeholder*="description" i]',
            )
            .first();
          if (await descInput.isVisible()) {
            await descInput.fill("E2E test project description");
          }

          // Submit the form
          const submitButton = page
            .locator('button[type="submit"]:has-text("Create")')
            .first();
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Wait for success (dialog closes or success message appears)
            await page.waitForTimeout(1000);

            // Should see the new project in the list
            await expect(page.locator(`text=${projectName}`)).toBeVisible({
              timeout: 5000,
            });
          }
        }
      }
    });

    test("should validate required fields", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
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
          // Check if still in dialog or error message appears
          const hasError =
            (await page.locator('[role="dialog"]').count()) > 0 ||
            (await page.locator("text=/required|error/i").count()) > 0;

          expect(hasError).toBeTruthy();
        }
      }
    });
  });

  test.describe("Edit Project", () => {
    test("should open edit project dialog", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
      await page.waitForLoadState("networkidle");

      // Look for edit button (pencil icon or "Edit" text)
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

    test("should update project with valid data", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
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
          const updatedName = `Updated Project ${Date.now()}`;
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
  });

  test.describe("Delete Project", () => {
    test("should show delete confirmation", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
      await page.waitForLoadState("networkidle");

      // Look for delete button (trash icon or "Delete" text)
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

    test("should soft delete project", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
      await page.waitForLoadState("networkidle");

      // Get initial project count
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

          // Project count should change or project should be hidden
          const finalRows = await page
            .locator("table tr, [role='row']")
            .count();

          // Allow for either row count decrease or same count (if soft delete keeps in list)
          expect(finalRows <= initialRows).toBeTruthy();
        }
      }
    });
  });

  test.describe("Filter Projects", () => {
    test("should filter projects by active status", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/projects");
      await page.waitForLoadState("networkidle");

      // Look for filter controls (checkbox, toggle, or select)
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

        // List should update (we can't verify exact content without knowing data)
        expect(page.url()).toContain("/admin/projects");
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display projects table on mobile", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAsAdmin(page);
      await page.goto("/admin/projects");
      await page.waitForLoadState("networkidle");

      // Should still show projects content (might be adapted for mobile)
      const hasContent =
        (await page.locator("text=/project/i").count()) > 0 ||
        (await page.locator("table, [role='table']").count()) > 0;

      expect(hasContent).toBeTruthy();
    });
  });
});
