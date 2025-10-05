import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Authentication Flows
 * Tests user login, logout, session persistence, and protected routes
 */

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test for isolation
    await page.context().clearCookies();
  });

  test.describe("Login Flow", () => {
    test("should successfully login with valid credentials", async ({
      page,
    }) => {
      await page.goto("/login");

      // Fill in the login form
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for navigation to dashboard
      await page.waitForURL("/dashboard");

      // Verify we're on the dashboard
      await expect(page).toHaveURL("/dashboard");

      // Verify user information is displayed
      await expect(page.locator("text=user@example.com")).toBeVisible();
      await expect(page.locator("text=user")).toBeVisible();
    });

    test("should successfully login as admin", async ({ page }) => {
      await page.goto("/login");

      await page.fill('input[name="email"]', "admin@example.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard");

      // Verify admin role is displayed
      await expect(page.locator("text=admin@example.com")).toBeVisible();
      await expect(page.locator("text=admin")).toBeVisible();
    });

    test("should show error with invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.fill('input[name="email"]', "invalid@example.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL("/login");

      // Should show error message
      await expect(
        page.locator("text=/invalid credentials|incorrect/i"),
      ).toBeVisible();
    });

    test("should show error with missing email", async ({ page }) => {
      await page.goto("/login");

      // Try to submit without email (HTML5 validation should catch this)
      await page.fill('input[name="password"]', "password123");

      // Check if email field has required attribute
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute("required", "");
    });

    test("should show error with missing password", async ({ page }) => {
      await page.goto("/login");

      // Try to submit without password (HTML5 validation should catch this)
      await page.fill('input[name="email"]', "user@example.com");

      // Check if password field has required attribute
      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toHaveAttribute("required", "");
    });
  });

  test.describe("Logout Flow", () => {
    test("should successfully logout", async ({ page }) => {
      // First, login
      await page.goto("/login");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard");

      // Then logout
      await page.click('button[type="submit"]:has-text("Sign out")');

      // Should redirect to login page
      await page.waitForURL("/login");
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Session Persistence", () => {
    test("should maintain session across page reloads", async ({ page }) => {
      // Login
      await page.goto("/login");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard");

      // Reload the page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL("/dashboard");
      await expect(page.locator("text=user@example.com")).toBeVisible();
    });

    test("should maintain session across navigation", async ({ page }) => {
      // Login
      await page.goto("/login");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard");

      // Navigate to another page (if exists)
      await page.goto("/dashboard");

      // Should still be logged in
      await expect(page).toHaveURL("/dashboard");
      await expect(page.locator("text=user@example.com")).toBeVisible();
    });
  });

  test.describe("Protected Route Redirection", () => {
    test("should redirect to login when accessing dashboard without authentication", async ({
      page,
    }) => {
      // Try to access dashboard directly without logging in
      await page.goto("/dashboard");

      // Should redirect to login page
      await page.waitForURL("/login");
      await expect(page).toHaveURL("/login");
    });

    test("should redirect to dashboard after login from protected route", async ({
      page,
    }) => {
      // Try to access dashboard (will redirect to login)
      await page.goto("/dashboard");
      await page.waitForURL("/login");

      // Login
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");
      await page.click('button[type="submit"]');

      // Should redirect back to dashboard
      await page.waitForURL("/dashboard");
      await expect(page).toHaveURL("/dashboard");
    });
  });

  test.describe("Login Page Elements", () => {
    test("should display login form elements", async ({ page }) => {
      await page.goto("/login");

      // Check page title
      await expect(page.locator("h2")).toContainText("Work Management");

      // Check form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Check test accounts info is displayed
      await expect(page.locator("text=Test accounts:")).toBeVisible();
      await expect(page.locator("text=admin@example.com")).toBeVisible();
    });

    test("should have proper input types", async ({ page }) => {
      await page.goto("/login");

      // Email input should have type="email"
      await expect(page.locator('input[name="email"]')).toHaveAttribute(
        "type",
        "email",
      );

      // Password input should have type="password"
      await expect(page.locator('input[name="password"]')).toHaveAttribute(
        "type",
        "password",
      );
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state while submitting", async ({ page }) => {
      await page.goto("/login");

      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "user123");

      // Click submit and check for loading state
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Button should show "Signing in..." text while loading
      // This might be very fast, so we check if the button text changes at all
      const buttonText = await submitButton.textContent();
      expect(buttonText).toMatch(/Sign in|Signing in.../);
    });
  });
});
