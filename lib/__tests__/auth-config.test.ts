import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock NextAuth
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
  })),
}));

describe("auth-config simplified implementation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("authorized callback", () => {
    /**
     * New simplified implementation:
     * - authorized() only checks authentication (returns true/false)
     * - NO route-specific logic (moved to middleware.ts)
     * - NO redirects (handled by middleware.ts)
     */

    it("should bypass auth in development mode when DISABLE_AUTH=true", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DISABLE_AUTH", "true");

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters
      const mockParams = {
        auth: null, // No authentication
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should return true (bypass auth in development)
      expect(result).toBe(true);
    });

    it("should NOT bypass auth in production even if DISABLE_AUTH=true", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DISABLE_AUTH", "true");

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters
      const mockParams = {
        auth: null, // No authentication
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should return false (enforce authentication in production)
      expect(result).toBe(false);
    });

    it("should require auth in development when DISABLE_AUTH=false", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DISABLE_AUTH", "false");

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters
      const mockParams = {
        auth: null, // No authentication
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should return false (require authentication)
      expect(result).toBe(false);
    });

    it("should allow authenticated users", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DISABLE_AUTH", "false");

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters with authenticated user
      const mockParams = {
        auth: {
          user: { id: "1", email: "user@example.com" },
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should allow access (return true)
      expect(result).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DISABLE_AUTH", "false");

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters
      const mockParams = {
        auth: null, // No authentication
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should reject access (return false)
      expect(result).toBe(false);
    });

    it("should work consistently regardless of route (route logic is in middleware)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DISABLE_AUTH", "false");

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Test with different routes - should behave the same (no route logic)
      const routes = [
        "/dashboard",
        "/work-logs",
        "/admin/projects",
        "/login",
        "/auth/signin",
      ];

      for (const route of routes) {
        // Unauthenticated
        const unauthResult = authConfig.callbacks?.authorized?.({
          auth: null,
        } as any);
        expect(unauthResult).toBe(false);

        // Authenticated
        const authResult = authConfig.callbacks?.authorized?.({
          auth: { user: { id: "1" } },
        } as any);
        expect(authResult).toBe(true);
      }
    });
  });

  describe("callback configurations", () => {
    it("should add role and id to JWT token", async () => {
      const { authConfig } = await import("../auth-config");

      const mockUser = {
        id: "123",
        email: "user@example.com",
        role: "admin",
      };

      const mockToken = {};

      const result = await authConfig.callbacks?.jwt?.({
        token: mockToken,
        user: mockUser,
      } as any);

      expect(result).toEqual({
        role: "admin",
        id: "123",
      });
    });

    it("should preserve existing token when no user provided", async () => {
      const { authConfig } = await import("../auth-config");

      const existingToken = {
        role: "user",
        id: "456",
        email: "existing@example.com",
      };

      const result = await authConfig.callbacks?.jwt?.({
        token: existingToken,
        user: null,
      } as any);

      expect(result).toEqual(existingToken);
    });

    it("should add role and id to session from token", async () => {
      const { authConfig } = await import("../auth-config");

      const mockSession = {
        user: {
          email: "user@example.com",
        },
      };

      const mockToken = {
        role: "manager",
        id: "789",
      };

      const result = await authConfig.callbacks?.session?.({
        session: mockSession,
        token: mockToken,
      } as any);

      expect(result).toEqual({
        user: {
          email: "user@example.com",
          role: "manager",
          id: "789",
        },
      });
    });
  });
});
