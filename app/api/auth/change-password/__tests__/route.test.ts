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

// Mock modules
vi.mock("@/lib/auth-helpers", () => ({
  getAuthenticatedSession: vi.fn(),
}));

vi.mock("@/lib/db/repositories/user-repository", () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/lib/utils/password", () => ({
  hashPassword: vi.fn(),
  validatePasswordStrength: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { getUserById, updateUser } from "@/lib/db/repositories/user-repository";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/utils/password";
import { POST } from "../route";

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "Current123!",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 400 for missing current password", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
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

  it("should return 400 for weak new password", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: false,
      score: 1,
      errors: ["Password must contain at least one uppercase letter"],
      suggestions: ["Add uppercase letters"],
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "Current123!",
          newPassword: "weakpass123", // Meets minimum length but lacks uppercase
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("WEAK_PASSWORD");
    expect(data.error.details).toBeDefined();
  });

  it("should return 404 if user not found", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "nonexistent-user", role: "user" },
    });

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(getUserById).mockResolvedValue(undefined);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "Current123!",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("USER_NOT_FOUND");
  });

  it("should return 400 if current password is incorrect", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user",
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // First call: verifyPassword for current password (incorrect)
    // Second call: won't be reached
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "WrongPassword123!",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_PASSWORD");
  });

  it("should return 400 if new password is same as current", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user",
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // First call: verifyPassword for current password (correct)
    // Second call: verifyPassword checking if new password is same (true)
    vi.mocked(verifyPassword)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "SamePass123!",
          newPassword: "SamePass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("SAME_PASSWORD");
  });

  it("should successfully change password with valid data", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$oldhashedpassword",
      passwordResetRequired: false,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(getUserById).mockResolvedValue(mockUser);

    // First call: verify current password (correct)
    // Second call: check if new password is same as current (different)
    vi.mocked(verifyPassword)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    vi.mocked(hashPassword).mockResolvedValue("$2a$10$newhashedpassword");

    vi.mocked(updateUser).mockResolvedValue({
      ...mockUser,
      passwordHash: "$2a$10$newhashedpassword",
      lastPasswordChange: new Date(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "CurrentPass123!",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();

    // Verify updateUser was called with correct data
    expect(updateUser).toHaveBeenCalledWith("user-1", {
      passwordHash: "$2a$10$newhashedpassword",
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
      passwordResetRequired: true, // User needs to reset password
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(getUserById).mockResolvedValue(mockUser);
    vi.mocked(verifyPassword)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    vi.mocked(hashPassword).mockResolvedValue("$2a$10$newhashedpassword");
    vi.mocked(updateUser).mockResolvedValue({
      ...mockUser,
      passwordHash: "$2a$10$newhashedpassword",
      passwordResetRequired: false,
      lastPasswordChange: new Date(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "CurrentPass123!",
          newPassword: "NewPass123!",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify passwordResetRequired was set to false
    expect(updateUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        passwordResetRequired: false,
      }),
    );
  });

  it("should return 500 on database error", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    vi.mocked(validatePasswordStrength).mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
      suggestions: [],
    });

    vi.mocked(getUserById).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "CurrentPass123!",
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
