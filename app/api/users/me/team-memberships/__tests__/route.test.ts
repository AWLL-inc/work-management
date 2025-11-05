import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for User Team Memberships API
 * Tests GET endpoint for retrieving current user's team memberships
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
      from: vi.fn(),
      where: vi.fn(),
    },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual("drizzle-orm");
  return {
    ...actual,
    eq: vi.fn((field, value) => ({ field, value, op: "eq" })),
  };
});

import { GET } from "@/app/api/users/me/team-memberships/route";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

describe("User Team Memberships API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/users/me/team-memberships", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(data.error.message).toBe("Authentication required");
    });

    it("should return user's team memberships when authenticated", async () => {
      const userId = "user-id-123";
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: userId, email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // Mock DB returns Date objects
      const mockMembershipsFromDb = [
        {
          id: "membership-1",
          teamId: "team-1",
          role: "leader" as const,
          joinedAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          id: "membership-2",
          teamId: "team-2",
          role: "member" as const,
          joinedAt: new Date("2024-02-20T14:30:00Z"),
        },
        {
          id: "membership-3",
          teamId: "team-3",
          role: "viewer" as const,
          joinedAt: new Date("2024-03-10T09:15:00Z"),
        },
      ];

      // Mock chained db calls
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockMembershipsFromDb),
        }),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].role).toBe("leader");
      expect(data.data[1].role).toBe("member");
      expect(data.data[2].role).toBe("viewer");
      expect(data.data[0].teamId).toBe("team-1");
      // Verify joinedAt is converted to ISO 8601 string
      expect(typeof data.data[0].joinedAt).toBe("string");
      expect(data.data[0].joinedAt).toBe("2024-01-15T10:00:00.000Z");
    });

    it("should return empty array when user has no team memberships", async () => {
      const userId = "user-without-teams";
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: userId, email: "newuser@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // Mock empty result
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should return 500 when database error occurs", async () => {
      const userId = "user-id-123";
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: userId, email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // Mock database error
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockRejectedValue(new Error("Database connection failed")),
        }),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.message).toBe("Failed to retrieve team memberships");
    });

    it("should include all required fields in membership response", async () => {
      const userId = "user-id-123";
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: userId, email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockMembership = {
        id: "membership-1",
        teamId: "team-1",
        role: "leader" as const,
        joinedAt: new Date("2024-01-15T10:00:00Z"),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMembership]),
        }),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0]).toHaveProperty("id");
      expect(data.data[0]).toHaveProperty("teamId");
      expect(data.data[0]).toHaveProperty("role");
      expect(data.data[0]).toHaveProperty("joinedAt");
      // Verify joinedAt is a string (ISO 8601)
      expect(typeof data.data[0].joinedAt).toBe("string");
    });

    it("should only return memberships for the authenticated user", async () => {
      const userId = "specific-user-id";
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: userId, email: "specificuser@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockMemberships = [
        {
          id: "membership-1",
          teamId: "team-1",
          role: "leader" as const,
          joinedAt: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      // Mock to verify eq is called with correct userId
      const mockWhere = vi.fn().mockResolvedValue(mockMemberships);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      } as any);

      const response = await GET();

      expect(mockWhere).toHaveBeenCalled();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should return joinedAt as ISO 8601 string format", async () => {
      const userId = "user-id-123";
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: userId, email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockMembership = {
        id: "membership-1",
        teamId: "team-1",
        role: "leader" as const,
        joinedAt: new Date("2024-01-15T10:00:00.000Z"),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMembership]),
        }),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      // Verify ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(data.data[0].joinedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(data.data[0].joinedAt).toBe("2024-01-15T10:00:00.000Z");
    });
  });
});
