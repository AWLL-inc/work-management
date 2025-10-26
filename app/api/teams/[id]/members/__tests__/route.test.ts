import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for Team Members API (POST)
 * Tests POST endpoint with authentication, authorization, and validation
 */

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

vi.mock("@/lib/auth-helpers", () => ({
  getAuthenticatedSession: vi.fn(),
}));

vi.mock("@/lib/db/connection", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
      limit: vi.fn(),
      values: vi.fn(),
      returning: vi.fn(),
    },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual("drizzle-orm");
  return {
    ...actual,
    eq: vi.fn((field, value) => ({ field, value, op: "eq" })),
    and: vi.fn((...conditions) => ({ conditions, op: "and" })),
  };
});

import { POST } from "@/app/api/teams/[id]/members/route";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

describe("Team Members API - POST", () => {
  const teamId = "550e8400-e29b-41d4-a716-446655440000";
  const userId = "550e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 if user is not admin", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-id", email: "user@example.com", role: "user" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("should return 404 if team not found", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "admin" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    // Mock team not found
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // Empty array
        }),
      }),
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("NOT_FOUND");
    expect(data.error.message).toBe("Team not found");
  });

  it("should return 404 if user not found", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "admin" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const mockTeam = {
      id: teamId,
      name: "Team A",
      isActive: true,
    };

    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      if (callCount++ === 0) {
        // First call: check if team exists
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockTeam]),
            }),
          }),
        } as any;
      } else {
        // Second call: check if user exists - not found
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // Empty array
            }),
          }),
        } as any;
      }
    });

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("NOT_FOUND");
    expect(data.error.message).toBe("User not found");
  });

  it("should return 400 if user is already a member", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "admin" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const mockTeam = {
      id: teamId,
      name: "Team A",
      isActive: true,
    };

    const mockUser = {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      role: "user" as const,
    };

    const existingMember = {
      id: "member-1",
      teamId,
      userId,
      role: "member",
      joinedAt: new Date(),
    };

    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      if (callCount === 0) {
        callCount++;
        // First call: check if team exists
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockTeam]),
            }),
          }),
        } as any;
      } else if (callCount === 1) {
        callCount++;
        // Second call: check if user exists
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        } as any;
      } else {
        // Third call: check if already a member - found
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([existingMember]),
            }),
          }),
        } as any;
      }
    });

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("ALREADY_MEMBER");
  });

  it("should add member successfully with default role", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "admin" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const mockTeam = {
      id: teamId,
      name: "Team A",
      isActive: true,
    };

    const mockUser = {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      role: "user" as const,
    };

    const newMember = {
      id: "new-member-id",
      teamId,
      userId,
      role: "member",
      joinedAt: new Date(),
    };

    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      if (callCount === 0) {
        callCount++;
        // First call: check if team exists
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockTeam]),
            }),
          }),
        } as any;
      } else if (callCount === 1) {
        callCount++;
        // Second call: check if user exists
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        } as any;
      } else {
        // Third call: check if already a member - not found
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as any;
      }
    });

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newMember]),
      }),
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.userId).toBe(userId);
    expect(data.data.teamId).toBe(teamId);
    expect(data.data.role).toBe("member");
  });

  it("should add member with specified role", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "admin" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const mockTeam = {
      id: teamId,
      name: "Team A",
      isActive: true,
    };

    const mockUser = {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      role: "user" as const,
    };

    const newMember = {
      id: "new-member-id",
      teamId,
      userId,
      role: "leader",
      joinedAt: new Date(),
    };

    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      if (callCount === 0) {
        callCount++;
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockTeam]),
            }),
          }),
        } as any;
      } else if (callCount === 1) {
        callCount++;
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        } as any;
      } else {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as any;
      }
    });

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newMember]),
      }),
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId, role: "leader" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.role).toBe("leader");
  });

  it("should return 400 for validation errors", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "admin" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    // Mock team exists so we get to validation
    const mockTeam = {
      id: teamId,
      name: "Team A",
      isActive: true,
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockTeam]),
        }),
      }),
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId: "invalid-uuid" }), // Invalid UUID
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: teamId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});
