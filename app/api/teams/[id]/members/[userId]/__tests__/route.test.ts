import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for Team Members API (DELETE)
 * Tests DELETE endpoint with authentication, authorization, and validation
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
      delete: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
      limit: vi.fn(),
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

vi.mock("@/lib/permissions", () => ({
  getTeamRole: vi.fn(),
  canManageTeamMembers: vi.fn(),
}));

import { DELETE } from "@/app/api/teams/[id]/members/[userId]/route";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { canManageTeamMembers, getTeamRole } from "@/lib/permissions";

describe("Team Members API - DELETE", () => {
  const teamId = "550e8400-e29b-41d4-a716-446655440000";
  const userId = "550e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: admin permissions (can be overridden in specific tests)
    vi.mocked(getTeamRole).mockResolvedValue(null);
    vi.mocked(canManageTeamMembers).mockReturnValue(true);
  });

  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members/${userId}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: teamId, userId }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 if user is not admin or team leader", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "user-id", email: "user@example.com", role: "user" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    // User is not a team leader (just a regular member)
    vi.mocked(getTeamRole).mockResolvedValue("member");
    vi.mocked(canManageTeamMembers).mockReturnValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members/${userId}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: teamId, userId }),
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
      `http://localhost:3000/api/teams/${teamId}/members/${userId}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: teamId, userId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("NOT_FOUND");
    expect(data.error.message).toBe("Team not found");
  });

  it("should return 404 if member not found in team", async () => {
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
        // Second call: check if member exists - not found
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
      `http://localhost:3000/api/teams/${teamId}/members/${userId}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: teamId, userId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("NOT_FOUND");
    expect(data.error.message).toBe("Member not found in this team");
  });

  it("should remove member successfully", async () => {
    vi.mocked(getAuthenticatedSession).mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "admin" },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const mockTeam = {
      id: teamId,
      name: "Team A",
      isActive: true,
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
        // Second call: check if member exists
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([existingMember]),
            }),
          }),
        } as any;
      }
    });

    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    } as any);

    const request = new NextRequest(
      `http://localhost:3000/api/teams/${teamId}/members/${userId}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: teamId, userId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify delete was called
    expect(vi.mocked(db.delete)).toHaveBeenCalled();
  });
});
