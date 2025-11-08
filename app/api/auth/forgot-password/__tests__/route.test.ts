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
vi.mock("@/lib/db/repositories/user-repository", () => ({
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/lib/services/email", () => ({
  emailService: {
    sendPasswordResetEmail: vi.fn(),
  },
}));

vi.mock("@/lib/utils/password", () => ({
  generateResetToken: vi.fn(),
  hashResetToken: vi.fn(),
}));

import {
  getUserByEmail,
  updateUser,
} from "@/lib/db/repositories/user-repository";
import { emailService } from "@/lib/services/email";
import { generateResetToken, hashResetToken } from "@/lib/utils/password";
import { POST } from "../route";

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for invalid email format", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for missing email", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return success even if user does not exist (email enumeration prevention)", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(undefined);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("If an account with that email exists");

    // Should NOT call updateUser or send email
    expect(updateUser).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should generate reset token and send email for existing user", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(generateResetToken).mockReturnValue("reset-token-123");
    vi.mocked(hashResetToken).mockReturnValue("hashed-reset-token-123");
    vi.mocked(updateUser).mockResolvedValue({
      ...mockUser,
      passwordResetToken: "hashed-reset-token-123",
      passwordResetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    });
    vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue({
      success: true,
      messageId: "mock-message-id",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("If an account with that email exists");

    // Verify token generation
    expect(generateResetToken).toHaveBeenCalledOnce();
    expect(hashResetToken).toHaveBeenCalledWith("reset-token-123");

    // Verify user update
    expect(updateUser).toHaveBeenCalledWith("user-1", {
      passwordResetToken: "hashed-reset-token-123",
      passwordResetTokenExpires: expect.any(Date),
    });

    // Verify email sent
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Test User",
      "reset-token-123",
    );
  });

  it("should handle user with no name", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: null,
      role: "user" as const,
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(generateResetToken).mockReturnValue("reset-token-123");
    vi.mocked(hashResetToken).mockReturnValue("hashed-reset-token-123");
    vi.mocked(updateUser).mockResolvedValue({
      ...mockUser,
      passwordResetToken: "hashed-reset-token-123",
      passwordResetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    });
    vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue({
      success: true,
      messageId: "mock-message-id",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify email sent with default name "User"
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      "User",
      "reset-token-123",
    );
  });

  it("should still return success if email sending fails", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(generateResetToken).mockReturnValue("reset-token-123");
    vi.mocked(hashResetToken).mockReturnValue("hashed-reset-token-123");
    vi.mocked(updateUser).mockResolvedValue({
      ...mockUser,
      passwordResetToken: "hashed-reset-token-123",
      passwordResetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Email service fails
    vi.mocked(emailService.sendPasswordResetEmail).mockRejectedValue(
      new Error("SMTP connection failed"),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    // Should still return success (token is stored even if email fails)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Token should still be saved
    expect(updateUser).toHaveBeenCalled();
  });

  it("should return 500 on database error", async () => {
    vi.mocked(getUserByEmail).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });

  it("should set token expiration to 1 hour from now", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "user" as const,
      passwordHash: "$2a$10$hashedpassword",
      passwordResetRequired: false,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const now = Date.now();
    vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(generateResetToken).mockReturnValue("reset-token-123");
    vi.mocked(hashResetToken).mockReturnValue("hashed-reset-token-123");
    vi.mocked(updateUser).mockResolvedValue(mockUser);
    vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue({
      success: true,
      messageId: "mock-message-id",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      },
    );

    await POST(request);

    // Verify expiration time is approximately 1 hour from now
    expect(updateUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        passwordResetToken: "hashed-reset-token-123",
        passwordResetTokenExpires: expect.any(Date),
      }),
    );

    const updateCall = vi.mocked(updateUser).mock.calls[0];
    const expiresAt = updateCall[1].passwordResetTokenExpires as Date;
    const expectedExpiry = now + 60 * 60 * 1000; // 1 hour

    // Allow 1 second tolerance for test execution time
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
  });
});
