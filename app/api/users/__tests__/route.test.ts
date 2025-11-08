import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies - must be before imports
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
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/auth-helpers", () => ({
  getAuthenticatedSession: vi.fn(),
}));
vi.mock("@/lib/db/repositories/user-repository", () => ({
  getAllUsers: vi.fn(),
}));

import * as authHelpers from "@/lib/auth-helpers";
import * as userRepository from "@/lib/db/repositories/user-repository";
import { GET } from "../route";

describe("GET /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/users");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return sanitized users when authenticated", async () => {
    const mockSession = {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const mockUsers = [
      {
        id: "user1",
        name: "User 1",
        email: "user1@example.com",
        role: "user",
        emailVerified: null,
        image: null,
        passwordHash: "should-be-removed",
        passwordResetRequired: false,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        lastPasswordChange: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user2",
        name: "User 2",
        email: "user2@example.com",
        role: "admin",
        emailVerified: new Date(),
        image: "image.jpg",
        passwordHash: "should-also-be-removed",
        passwordResetRequired: false,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        lastPasswordChange: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );
    vi.mocked(userRepository.getAllUsers).mockResolvedValue(mockUsers);

    const request = new NextRequest("http://localhost:3000/api/users");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(2);

    // Verify password hashes are not included
    for (const user of data.data) {
      expect(user).not.toHaveProperty("passwordHash");
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("role");
    }
  });

  it("should filter active users when activeOnly=true", async () => {
    const mockSession = {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const mockUsers = [
      {
        id: "user1",
        name: "User 1",
        email: "user1@example.com",
        role: "user",
        emailVerified: null,
        image: null,
        passwordHash: "hash",
        passwordResetRequired: false,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        lastPasswordChange: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );
    vi.mocked(userRepository.getAllUsers).mockResolvedValue(mockUsers);

    const request = new NextRequest(
      "http://localhost:3000/api/users?activeOnly=true",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(userRepository.getAllUsers).toHaveBeenCalledWith({
      activeOnly: true,
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    // All returned users should not have 'inactive' role
    for (const user of data.data) {
      expect(user.role).not.toBe("inactive");
    }
  });

  it("should return all users when activeOnly is not specified", async () => {
    const mockSession = {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const mockUsers = [
      {
        id: "user1",
        name: "User 1",
        email: "user1@example.com",
        role: "user",
        emailVerified: null,
        image: null,
        passwordHash: "hash",
        passwordResetRequired: false,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        lastPasswordChange: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );
    vi.mocked(userRepository.getAllUsers).mockResolvedValue(mockUsers);

    const request = new NextRequest("http://localhost:3000/api/users");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(userRepository.getAllUsers).toHaveBeenCalledWith({
      activeOnly: false,
    });

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("should return 400 for invalid query parameters", async () => {
    const mockSession = {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );

    const request = new NextRequest(
      "http://localhost:3000/api/users?activeOnly=invalid",
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 500 when repository throws error", async () => {
    const mockSession = {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );
    vi.mocked(userRepository.getAllUsers).mockRejectedValue(
      new Error("Database error"),
    );

    const request = new NextRequest("http://localhost:3000/api/users");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
