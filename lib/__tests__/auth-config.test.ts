import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock NextAuth
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
  })),
}));

describe("auth-config DISABLE_AUTH functionality", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NODE_ENV') || key.startsWith('DISABLE_AUTH')) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("authorized callback", () => {
    // We'll test the logic by importing and testing the configuration object
    // Since the auth-config.ts exports the configuration, we need to test the authorized function

    it("should bypass auth in development mode when DISABLE_AUTH=true", async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      Object.defineProperty(process.env, 'DISABLE_AUTH', { value: 'true', writable: true });

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters
      const mockParams = {
        auth: null, // No authentication
        request: {
          nextUrl: new URL("http://localhost:3000/dashboard"),
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should return true (bypass auth)
      expect(result).toBe(true);
    });

    it("should enforce auth in production even if DISABLE_AUTH=true", async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      Object.defineProperty(process.env, 'DISABLE_AUTH', { value: 'true', writable: true });

      // Mock console.error to verify it's called
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters
      const mockParams = {
        auth: null, // No authentication
        request: {
          nextUrl: new URL("http://localhost:3000/dashboard"),
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should enforce authentication (not return true immediately)
      expect(result).not.toBe(true);

      // Should log security warning
      expect(consoleSpy).toHaveBeenCalledWith(
        "SECURITY WARNING: DISABLE_AUTH is set in production environment - ignoring this setting",
      );

      consoleSpy.mockRestore();
    });

    it("should enforce auth in development when DISABLE_AUTH=false", async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      Object.defineProperty(process.env, 'DISABLE_AUTH', { value: 'false', writable: true });

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters for protected route
      const mockParams = {
        auth: null, // No authentication
        request: {
          nextUrl: new URL("http://localhost:3000/work-logs"),
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should redirect to signin (Response object)
      expect(result).toBeInstanceOf(Response);
    });

    it("should allow authenticated user to access protected routes", async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      Object.defineProperty(process.env, 'DISABLE_AUTH', { value: 'false', writable: true });

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters with authenticated user
      const mockParams = {
        auth: {
          user: { id: "1", email: "user@example.com" },
        },
        request: {
          nextUrl: new URL("http://localhost:3000/work-logs"),
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should allow access
      expect(result).toBe(true);
    });

    it("should redirect unauthenticated users from protected routes", async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      Object.defineProperty(process.env, 'DISABLE_AUTH', { value: 'false', writable: true });

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters
      const mockParams = {
        auth: null, // No authentication
        request: {
          nextUrl: new URL("http://localhost:3000/work-logs"),
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should redirect to signin
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.headers.get("location")).toContain("/auth/signin");
      }
    });

    it("should allow access to auth pages for unauthenticated users", async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      Object.defineProperty(process.env, 'DISABLE_AUTH', { value: 'false', writable: true });

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters for auth page
      const mockParams = {
        auth: null, // No authentication
        request: {
          nextUrl: new URL("http://localhost:3000/auth/signin"),
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should allow access to auth pages
      expect(result).toBe(true);
    });

    it("should redirect authenticated users away from auth pages", async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      Object.defineProperty(process.env, 'DISABLE_AUTH', { value: 'false', writable: true });

      // Import the auth config
      const { authConfig } = await import("../auth-config");

      // Mock the authorized callback parameters with authenticated user accessing auth page
      const mockParams = {
        auth: {
          user: { id: "1", email: "user@example.com" },
        },
        request: {
          nextUrl: new URL("http://localhost:3000/auth/signin"),
        },
      };

      // Call the authorized callback
      const result = authConfig.callbacks?.authorized?.(mockParams as any);

      // Should redirect away from auth pages
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.headers.get("location")).toContain("/");
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
