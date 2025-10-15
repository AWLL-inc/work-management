import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockReturnValue("eq-condition"),
}));

// Mock schema
vi.mock("@/drizzle/schema", () => ({
  users: {
    id: "id",
    email: "email",
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock database connection
vi.mock("@/lib/db/connection", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "development",
    DISABLE_AUTH: false,
    DEV_USER_ID: "00000000-0000-0000-0000-000000000000",
  },
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { env } from "@/lib/env";
import {
  createUser,
  getAuthenticatedSession,
  getUserByEmail,
  getUserById,
  hashPassword,
  hasRole,
  verifyPassword,
} from "../auth-helpers";

describe("Authentication Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock env to default values
    vi.mocked(env).NODE_ENV = "development";
    vi.mocked(env).DISABLE_AUTH = false;
    vi.mocked(env).DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
  });

  describe("getAuthenticatedSession", () => {
    it("should return null when auth returns null", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const result = await getAuthenticatedSession();

      expect(result).toBeNull();
    });

    it("should return session when user is authenticated", async () => {
      const mockSession = {
        user: { id: "user-123", role: "user" },
        expires: "2024-12-31T23:59:59Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await getAuthenticatedSession();

      expect(result).toEqual(mockSession);
    });

    it("should return null when session exists but user is null", async () => {
      const mockSession = {
        user: null,
        expires: "2024-12-31T23:59:59Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await getAuthenticatedSession();

      expect(result).toBeNull();
    });

    describe("Development Auth Bypass", () => {
      beforeEach(() => {
        // Mock console.warn to avoid output during tests
        vi.spyOn(console, "warn").mockImplementation(() => {});
      });

      afterEach(() => {
        vi.mocked(console.warn).mockRestore();
      });

      it("should return mock admin session when DISABLE_AUTH is true in development", async () => {
        vi.mocked(env).NODE_ENV = "development";
        vi.mocked(env).DISABLE_AUTH = true;

        const result = await getAuthenticatedSession();

        expect(result).toEqual({
          user: { id: "00000000-0000-0000-0000-000000000000", role: "admin" },
        });
        expect(console.warn).toHaveBeenCalledWith(
          "⚠️  Authentication is disabled for development. User ID:",
          "00000000-0000-0000-0000-000000000000",
        );
        expect(console.warn).toHaveBeenCalledWith(
          "⚠️  This should NEVER happen in production!",
        );
      });

      it("should throw error when DISABLE_AUTH is true in production", async () => {
        vi.mocked(env).NODE_ENV = "production";
        vi.mocked(env).DISABLE_AUTH = true;

        await expect(getAuthenticatedSession()).rejects.toThrow(
          "DISABLE_AUTH cannot be enabled in production environment",
        );
      });

      it("should throw error when DISABLE_AUTH is true in CI environment", async () => {
        vi.mocked(env).NODE_ENV = "development";
        vi.mocked(env).DISABLE_AUTH = true;
        process.env.CI = "true";

        await expect(getAuthenticatedSession()).rejects.toThrow(
          "DISABLE_AUTH cannot be enabled in CI environment",
        );

        // Clean up
        delete process.env.CI;
      });

      it("should use normal auth when DISABLE_AUTH is false in development", async () => {
        vi.mocked(env).NODE_ENV = "development";
        vi.mocked(env).DISABLE_AUTH = false;

        const mockSession = {
          user: { id: "user-123", role: "user" },
          expires: "2024-12-31T23:59:59Z",
        };
        vi.mocked(auth).mockResolvedValue(mockSession as any);

        const result = await getAuthenticatedSession();

        expect(result).toEqual(mockSession);
        expect(console.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe("hashPassword", () => {
    it("should hash password with bcrypt", async () => {
      const password = "testpassword";
      const hashedPassword = "hashed-password";
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe("verifyPassword", () => {
    it("should verify password with bcrypt", async () => {
      const password = "testpassword";
      const hash = "hashed-password";
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const result = await verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it("should return false for invalid password", async () => {
      const password = "wrongpassword";
      const hash = "hashed-password";
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      const result = await verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });
  });

  describe("createUser", () => {
    it("should create user with hashed password", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "testpassword",
        role: "user" as const,
      };
      const hashedPassword = "hashed-password";
      const createdUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        passwordHash: hashedPassword,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword);
      vi.mocked(db.returning).mockResolvedValue([createdUser]);

      const result = await createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith("testpassword", 10);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        passwordHash: hashedPassword,
      });
      expect(db.returning).toHaveBeenCalled();

      // Should return user without password hash
      expect(result).toEqual({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        image: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found", async () => {
      const email = "john@example.com";
      const user = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
      };

      vi.mocked(db.limit).mockResolvedValue([user]);

      const result = await getUserByEmail(email);

      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it("should return null when user not found", async () => {
      const email = "notfound@example.com";

      vi.mocked(db.limit).mockResolvedValue([]);

      const result = await getUserByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      const id = "user-123";
      const user = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
      };

      vi.mocked(db.limit).mockResolvedValue([user]);

      const result = await getUserById(id);

      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it("should return null when user not found", async () => {
      const id = "nonexistent";

      vi.mocked(db.limit).mockResolvedValue([]);

      const result = await getUserById(id);

      expect(result).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("should return true for admin user requiring admin role", () => {
      const result = hasRole("admin", "admin");
      expect(result).toBe(true);
    });

    it("should return true for admin user requiring manager role", () => {
      const result = hasRole("admin", "manager");
      expect(result).toBe(true);
    });

    it("should return true for admin user requiring user role", () => {
      const result = hasRole("admin", "user");
      expect(result).toBe(true);
    });

    it("should return false for manager user requiring admin role", () => {
      const result = hasRole("manager", "admin");
      expect(result).toBe(false);
    });

    it("should return true for manager user requiring manager role", () => {
      const result = hasRole("manager", "manager");
      expect(result).toBe(true);
    });

    it("should return true for manager user requiring user role", () => {
      const result = hasRole("manager", "user");
      expect(result).toBe(true);
    });

    it("should return false for user requiring admin role", () => {
      const result = hasRole("user", "admin");
      expect(result).toBe(false);
    });

    it("should return false for user requiring manager role", () => {
      const result = hasRole("user", "manager");
      expect(result).toBe(false);
    });

    it("should return true for user requiring user role", () => {
      const result = hasRole("user", "user");
      expect(result).toBe(true);
    });

    it("should return false for invalid user role", () => {
      const result = hasRole("invalid", "user");
      expect(result).toBe(false);
    });

    it("should handle role hierarchy correctly", () => {
      // Test role hierarchy from highest to lowest: admin > manager > user
      expect(hasRole("admin", "user")).toBe(true);
      expect(hasRole("admin", "manager")).toBe(true);
      expect(hasRole("admin", "admin")).toBe(true);

      expect(hasRole("manager", "user")).toBe(true);
      expect(hasRole("manager", "manager")).toBe(true);
      expect(hasRole("manager", "admin")).toBe(false);

      expect(hasRole("user", "user")).toBe(true);
      expect(hasRole("user", "manager")).toBe(false);
      expect(hasRole("user", "admin")).toBe(false);
    });
  });
});
