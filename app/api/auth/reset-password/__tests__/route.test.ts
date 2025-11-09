import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment variables - must be first
vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test" as const,
    NEXTAUTH_SECRET: "test-secret-with-minimum-32-chars",
    NEXTAUTH_URL: "http://localhost:3000",
    POSTGRES_URL: "postgresql://test:test@localhost:5432/test",
    POSTGRES_URL_NON_POOLING: "postgresql://test:test@localhost:5432/test",
    DISABLE_AUTH: false,
    DEV_USER_ID: "00000000-0000-0000-0000-000000000000",
  },
}));

// Mock database connection
vi.mock("@/lib/db/connection", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock modules
vi.mock("@/lib/db/repositories/user-repository", () => ({
  updateUser: vi.fn(),
}));

vi.mock("@/lib/utils/password", () => ({
  hashPassword: vi.fn(),
  hashResetToken: vi.fn(),
  validatePasswordStrength: vi.fn(),
}));

import { db } from "@/lib/db/connection";
import { updateUser } from "@/lib/db/repositories/user-repository";
import {
  hashPassword,
  hashResetToken,
  validatePasswordStrength,
} from "@/lib/utils/password";
import { POST } from "../route";

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for missing token", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for weak password", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "reset-token-123",
          newPassword: "weak", // Too short
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for invalid token", async () => {
    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(hashResetToken).mockReturnValue("hashed-token");

    // Mock database query - no user found
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // Empty array = no user found
        }),
      }),
    });
    vi.mocked(db.select).mockImplementation(mockSelect);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "invalid-token",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_TOKEN");
  });

  it("should return 400 for expired token", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: "hashed-token",
      passwordResetTokenExpires: new Date(Date.now() - 1000), // Expired 1 second ago
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(hashResetToken).mockReturnValue("hashed-token");

    // Mock database query - return user with expired token
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });
    vi.mocked(db.select).mockImplementation(mockSelect);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "reset-token-123",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("EXPIRED_TOKEN");
  });

  it("should return 400 for null expiration date", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: "hashed-token",
      passwordResetTokenExpires: null, // No expiration set
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(hashResetToken).mockReturnValue("hashed-token");

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });
    vi.mocked(db.select).mockImplementation(mockSelect);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "reset-token-123",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("EXPIRED_TOKEN");
  });

  it("should successfully reset password with valid token", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$oldhashedpassword",
      passwordResetRequired: true,
      passwordResetToken: "hashed-token",
      passwordResetTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // Valid for 1 hour
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(hashResetToken).mockReturnValue("hashed-token");

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });
    vi.mocked(db.select).mockImplementation(mockSelect);

    vi.mocked(hashPassword).mockResolvedValue("$2a$10$newhashedpassword");

    vi.mocked(updateUser).mockResolvedValue({
      ...mockUser,
      passwordHash: "$2a$10$newhashedpassword",
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      passwordResetRequired: false,
      lastPasswordChange: new Date(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "reset-token-123",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("successfully reset");

    // Verify password was hashed
    expect(hashPassword).toHaveBeenCalledWith("NewPass123!");

    // Verify user was updated with new password and cleared token
    expect(updateUser).toHaveBeenCalledWith("user-1", {
      passwordHash: "$2a$10$newhashedpassword",
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      passwordResetRequired: false,
      lastPasswordChange: expect.any(Date),
    });
  });

  it("should clear passwordResetRequired flag on success", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$oldhashedpassword",
      passwordResetRequired: true, // User was required to reset
      passwordResetToken: "hashed-token",
      passwordResetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(hashResetToken).mockReturnValue("hashed-token");

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });
    vi.mocked(db.select).mockImplementation(mockSelect);

    vi.mocked(hashPassword).mockResolvedValue("$2a$10$newhashedpassword");
    vi.mocked(updateUser).mockResolvedValue({
      ...mockUser,
      passwordHash: "$2a$10$newhashedpassword",
      passwordResetRequired: false,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "reset-token-123",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify passwordResetRequired was cleared
    expect(updateUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        passwordResetRequired: false,
      }),
    );
  });

  it("should return 500 on database error", async () => {
    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(hashResetToken).mockReturnValue("hashed-token");

    // Mock database error
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockRejectedValue(new Error("Database connection failed")),
        }),
      }),
    });
    vi.mocked(db.select).mockImplementation(mockSelect);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "reset-token-123",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
