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
  createUser: vi.fn(),
  getUserByEmail: vi.fn(),
}));
vi.mock("@/lib/services/email", () => ({
  emailService: {
    sendWelcomeEmail: vi.fn(),
  },
}));
vi.mock("@/lib/utils/password", () => ({
  generateSecurePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

import * as authHelpers from "@/lib/auth-helpers";
import * as userRepository from "@/lib/db/repositories/user-repository";
import { emailService } from "@/lib/services/email";
import * as password from "@/lib/utils/password";
import { GET, POST } from "../route";

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

describe("POST /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "New User",
        email: "newuser@example.com",
        role: "user",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 when user is not admin or manager", async () => {
    const mockSession = {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "user" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "New User",
        email: "newuser@example.com",
        role: "user",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("should return 409 when email already exists", async () => {
    const mockSession = {
      user: {
        id: "admin-user-id",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const existingUser = {
      id: "existing-user-id",
      name: "Existing User",
      email: "existing@example.com",
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
    };

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );
    vi.mocked(userRepository.getUserByEmail).mockResolvedValue(existingUser);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "New User",
        email: "existing@example.com",
        role: "user",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("CONFLICT");
  });

  it("should successfully create user with temporary password", async () => {
    const mockSession = {
      user: {
        id: "admin-user-id",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const newUser = {
      id: "new-user-id",
      name: "New User",
      email: "newuser@example.com",
      role: "user",
      emailVerified: null,
      image: null,
      passwordHash: "hashed-password",
      passwordResetRequired: true,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      lastPasswordChange: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );
    vi.mocked(userRepository.getUserByEmail).mockResolvedValue(undefined);
    vi.mocked(password.generateSecurePassword).mockReturnValue(
      "temp-password-123",
    );
    vi.mocked(password.hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(userRepository.createUser).mockResolvedValue(newUser);
    vi.mocked(emailService.sendWelcomeEmail).mockResolvedValue({
      success: true,
      messageId: "test-message-id",
    });

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "New User",
        email: "newuser@example.com",
        role: "user",
        sendEmail: true,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.temporaryPassword).toBe("temp-password-123");
    expect(data.data.email).toBe("newuser@example.com");
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
      "newuser@example.com",
      "New User",
      "newuser@example.com",
      "temp-password-123",
    );
  });

  it("should return 400 for validation errors", async () => {
    const mockSession = {
      user: {
        id: "admin-user-id",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin" as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(authHelpers.getAuthenticatedSession).mockResolvedValue(
      mockSession,
    );

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "",
        email: "invalid-email",
        role: "invalid-role",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});
