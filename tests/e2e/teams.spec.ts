import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Team Management
 * Tests team creation, editing, deletion, and member management
 */

test.describe("Team Management", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();

    // Login as admin for team management tests
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/work-logs");
  });

  test.describe("Team List Page", () => {
    test("should display teams page with header", async ({ page }) => {
      await page.goto("/admin/teams");

      // Verify page header
      await expect(page.locator("h1")).toContainText("Teams");
      await expect(
        page.locator("text=Manage team organization and members"),
      ).toBeVisible();

      // Verify Add Team button
      await expect(page.locator("button:has-text('Add Team')")).toBeVisible();
    });

    test("should display existing teams in table", async ({ page }) => {
      await page.goto("/admin/teams");

      // Wait for table to load
      await page.waitForSelector("table", { timeout: 5000 });

      // Verify table headers
      await expect(page.locator("text=Team Name")).toBeVisible();
      await expect(page.locator("text=Description")).toBeVisible();
      await expect(page.locator("text=Members")).toBeVisible();
      await expect(page.locator("text=Status")).toBeVisible();
    });
  });

  test.describe("Team Creation", () => {
    test("should successfully create a new team", async ({ page }) => {
      await page.goto("/admin/teams");

      // Click Add Team button
      await page.click("button:has-text('Add Team')");

      // Wait for dialog to open
      await expect(page.locator("text=Create New Team")).toBeVisible();

      // Fill in team form
      await page.fill('input[name="name"]', "E2E Test Team");
      await page.fill(
        'textarea[name="description"]',
        "Team created by E2E test",
      );

      // Submit form
      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for success message
      await expect(
        page.locator("text=Team created successfully"),
      ).toBeVisible();

      // Verify team appears in table
      await expect(page.locator("text=E2E Test Team")).toBeVisible();
      await expect(page.locator("text=Team created by E2E test")).toBeVisible();
    });

    test("should show validation error for empty team name", async ({
      page,
    }) => {
      await page.goto("/admin/teams");

      await page.click("button:has-text('Add Team')");
      await expect(page.locator("text=Create New Team")).toBeVisible();

      // Try to submit without name
      await page.fill('textarea[name="description"]', "Test description");
      await page.click('button[type="submit"]:has-text("Save")');

      // Should show validation error
      await expect(page.locator("text=Team name is required")).toBeVisible();
    });

    test("should create team with active status by default", async ({
      page,
    }) => {
      await page.goto("/admin/teams");

      await page.click("button:has-text('Add Team')");
      await page.fill('input[name="name"]', "Active Team Test");

      // Verify Active checkbox is checked by default
      const activeCheckbox = page.locator('input[name="isActive"]');
      await expect(activeCheckbox).toBeChecked();

      await page.click('button[type="submit"]:has-text("Save")');

      await expect(
        page.locator("text=Team created successfully"),
      ).toBeVisible();

      // Verify Active badge is displayed
      const teamRow = page.locator("tr:has-text('Active Team Test')");
      await expect(teamRow.locator("text=Active")).toBeVisible();
    });
  });

  test.describe("Team Editing", () => {
    test("should successfully edit team details", async ({ page }) => {
      await page.goto("/admin/teams");

      // Find first team and click edit
      const firstEditButton = page.locator('button[aria-label="Edit"]').first();
      await firstEditButton.click();

      // Wait for edit dialog
      await expect(page.locator("text=Edit Team")).toBeVisible();

      // Update team name
      const nameInput = page.locator('input[name="name"]');
      await nameInput.clear();
      await nameInput.fill("Updated Team Name");

      // Update description
      const descInput = page.locator('textarea[name="description"]');
      await descInput.clear();
      await descInput.fill("Updated description");

      // Submit
      await page.click('button[type="submit"]:has-text("Save")');

      // Verify success
      await expect(
        page.locator("text=Team updated successfully"),
      ).toBeVisible();
      await expect(page.locator("text=Updated Team Name")).toBeVisible();
    });

    test("should toggle team active status", async ({ page }) => {
      await page.goto("/admin/teams");

      // Click edit on first team
      await page.locator('button[aria-label="Edit"]').first().click();
      await expect(page.locator("text=Edit Team")).toBeVisible();

      // Toggle active checkbox
      const activeCheckbox = page.locator('input[name="isActive"]');
      const wasChecked = await activeCheckbox.isChecked();
      await activeCheckbox.click();

      // Submit
      await page.click('button[type="submit"]:has-text("Save")');

      // Verify success
      await expect(
        page.locator("text=Team updated successfully"),
      ).toBeVisible();

      // Verify status badge changed
      if (wasChecked) {
        await expect(page.locator("text=Inactive").first()).toBeVisible();
      } else {
        await expect(page.locator("text=Active").first()).toBeVisible();
      }
    });
  });

  test.describe("Team Deletion", () => {
    test("should show confirmation dialog before deleting team", async ({
      page,
    }) => {
      await page.goto("/admin/teams");

      // Click delete on first team
      await page.locator('button[aria-label="Delete"]').first().click();

      // Verify confirmation dialog
      await expect(page.locator("text=Delete Team")).toBeVisible();
      await expect(
        page.locator("text=Are you sure you want to delete"),
      ).toBeVisible();
      await expect(
        page.locator("text=This will mark it as inactive"),
      ).toBeVisible();
    });

    test("should cancel team deletion", async ({ page }) => {
      await page.goto("/admin/teams");

      // Get team name before delete attempt
      const firstTeamName = await page
        .locator("table tbody tr")
        .first()
        .locator("td")
        .first()
        .textContent();

      // Click delete
      await page.locator('button[aria-label="Delete"]').first().click();

      // Cancel
      await page.click('button:has-text("Cancel")');

      // Verify team still exists
      await expect(page.locator(`text=${firstTeamName}`)).toBeVisible();
    });

    test("should successfully delete team (soft delete)", async ({ page }) => {
      // First create a team to delete
      await page.goto("/admin/teams");
      await page.click("button:has-text('Add Team')");
      await page.fill('input[name="name"]', "Team to Delete");
      await page.click('button[type="submit"]:has-text("Save")');
      await expect(
        page.locator("text=Team created successfully"),
      ).toBeVisible();

      // Find and delete the team
      const teamRow = page.locator("tr:has-text('Team to Delete')");
      await teamRow.locator('button[aria-label="Delete"]').click();

      // Confirm deletion
      await page.click('button:has-text("Delete")');

      // Verify success
      await expect(
        page.locator("text=Team deleted successfully"),
      ).toBeVisible();

      // Team should be marked as inactive (soft delete)
      const deletedTeamRow = page.locator("tr:has-text('Team to Delete')");
      await expect(deletedTeamRow.locator("text=Inactive")).toBeVisible();
    });
  });

  test.describe("Team Detail Page", () => {
    test("should navigate to team detail page", async ({ page }) => {
      await page.goto("/admin/teams");

      // Click on first team (view button)
      await page.locator('button[aria-label="View"]').first().click();

      // Verify we're on team detail page
      await expect(page).toHaveURL(/\/admin\/teams\/[a-f0-9-]+/);

      // Verify page elements
      await expect(page.locator("text=Team Members")).toBeVisible();
      await expect(page.locator("button:has-text('Add Member')")).toBeVisible();
    });

    test("should display team information", async ({ page }) => {
      await page.goto("/admin/teams");

      // Get first team name
      const teamName = await page
        .locator("table tbody tr")
        .first()
        .locator("td")
        .first()
        .textContent();

      // Navigate to detail
      await page.locator('button[aria-label="View"]').first().click();

      // Verify team name is displayed
      await expect(page.locator(`h1:has-text("${teamName}")`)).toBeVisible();
    });

    test("should display back button to teams list", async ({ page }) => {
      await page.goto("/admin/teams");
      await page.locator('button[aria-label="View"]').first().click();

      // Verify back button exists
      const backButton = page.locator('a[href="/admin/teams"]');
      await expect(backButton).toBeVisible();

      // Click back button
      await backButton.click();

      // Verify we're back on teams list
      await expect(page).toHaveURL("/admin/teams");
    });
  });

  test.describe("Member Management", () => {
    test("should display Add Member dialog", async ({ page }) => {
      await page.goto("/admin/teams");
      await page.locator('button[aria-label="View"]').first().click();

      // Click Add Member button
      await page.click("button:has-text('Add Member')");

      // Verify dialog is open
      await expect(page.locator("text=Add Team Member")).toBeVisible();
      await expect(
        page.locator("text=Select a user and assign their role"),
      ).toBeVisible();

      // Verify form fields
      await expect(page.locator("text=User")).toBeVisible();
      await expect(page.locator("text=Role")).toBeVisible();
    });

    test("should successfully add member to team", async ({ page }) => {
      await page.goto("/admin/teams");
      await page.locator('button[aria-label="View"]').first().click();

      // Get initial member count
      const memberTable = page.locator("table");
      const initialRowCount = await memberTable.locator("tbody tr").count();

      // Open Add Member dialog
      await page.click("button:has-text('Add Member')");

      // Select a user (select first available user)
      await page.locator('button[role="combobox"]').first().click();
      await page.locator('[role="option"]').first().click();

      // Select role
      await page.locator('button[role="combobox"]').nth(1).click();
      await page.locator('[role="option"]:has-text("Member")').click();

      // Submit
      await page.click('button:has-text("Add Member")');

      // Verify success
      await expect(
        page.locator("text=Member added successfully"),
      ).toBeVisible();

      // Verify member was added to table
      const newRowCount = await memberTable.locator("tbody tr").count();
      expect(newRowCount).toBe(initialRowCount + 1);
    });

    test("should display member information in table", async ({ page }) => {
      await page.goto("/admin/teams");
      await page.locator('button[aria-label="View"]').first().click();

      // Verify table headers
      await expect(page.locator("text=Name")).toBeVisible();
      await expect(page.locator("text=Email")).toBeVisible();
      await expect(page.locator("text=Role")).toBeVisible();
      await expect(page.locator("text=Joined At")).toBeVisible();
      await expect(page.locator("text=Actions")).toBeVisible();
    });

    test("should show confirmation before removing member", async ({
      page,
    }) => {
      await page.goto("/admin/teams");
      await page.locator('button[aria-label="View"]').first().click();

      // Check if there are any members
      const memberRows = page.locator("table tbody tr");
      const memberCount = await memberRows.count();

      if (memberCount > 0) {
        // Click remove on first member
        await memberRows.first().locator('button[aria-label="Remove"]').click();

        // Verify confirmation dialog
        await expect(page.locator("text=Remove Team Member")).toBeVisible();
        await expect(
          page.locator("text=Are you sure you want to remove"),
        ).toBeVisible();
      }
    });

    test("should successfully remove member from team", async ({ page }) => {
      // First, go to team detail and add a member
      await page.goto("/admin/teams");
      await page.locator('button[aria-label="View"]').first().click();

      // Add a member first
      await page.click("button:has-text('Add Member')");
      await page.locator('button[role="combobox"]').first().click();
      await page.locator('[role="option"]').first().click();
      await page.locator('button:has-text("Add Member")').nth(1).click();

      await expect(
        page.locator("text=Member added successfully"),
      ).toBeVisible();

      // Get member count
      const memberTable = page.locator("table");
      const beforeCount = await memberTable.locator("tbody tr").count();

      // Remove the member
      await memberTable
        .locator("tbody tr")
        .first()
        .locator('button[aria-label="Remove"]')
        .click();

      // Confirm removal
      await page.click('button:has-text("Remove")');

      // Verify success
      await expect(
        page.locator("text=Member removed successfully"),
      ).toBeVisible();

      // Verify member count decreased
      const afterCount = await memberTable.locator("tbody tr").count();
      expect(afterCount).toBe(beforeCount - 1);
    });

    test("should allow selecting member role when adding", async ({ page }) => {
      await page.goto("/admin/teams");
      await page.locator('button[aria-label="View"]').first().click();

      await page.click("button:has-text('Add Member')");

      // Open role selector
      await page.locator('button[role="combobox"]').nth(1).click();

      // Verify role options
      await expect(
        page.locator('[role="option"]:has-text("Member")'),
      ).toBeVisible();
      await expect(
        page.locator('[role="option"]:has-text("Leader")'),
      ).toBeVisible();

      // Select Leader role
      await page.locator('[role="option"]:has-text("Leader")').click();

      // Role should be selected
      await expect(page.locator("text=Leader")).toBeVisible();
    });
  });

  test.describe("Search and Filter", () => {
    test("should filter teams by search", async ({ page }) => {
      await page.goto("/admin/teams");

      // Create a team with unique name
      await page.click("button:has-text('Add Team')");
      await page.fill('input[name="name"]', "Searchable Team XYZ");
      await page.click('button[type="submit"]:has-text("Save")');
      await expect(
        page.locator("text=Team created successfully"),
      ).toBeVisible();

      // Use search if available
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill("Searchable Team XYZ");

        // Should show only matching team
        await expect(page.locator("text=Searchable Team XYZ")).toBeVisible();
      }
    });
  });

  test.describe("Permissions", () => {
    test("should not allow non-admin to access teams page", async ({
      page,
    }) => {
      // Logout admin
      await page.click('button[type="submit"]:has-text("Sign out")');
      await page.waitForURL("/auth/signin");

      // Login as regular user
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/work-logs");

      // Try to access teams page
      await page.goto("/admin/teams");

      // Should be redirected or show error
      // (Exact behavior depends on implementation)
      const url = page.url();
      expect(url).not.toContain("/admin/teams");
    });
  });
});
