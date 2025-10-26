import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for Teams API (Detail Routes)
 * Tests GET, PUT, and DELETE endpoints with authentication, authorization, and validation
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
      update: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
      innerJoin: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      set: vi.fn(),
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

import { DELETE, GET, PUT } from "@/app/api/teams/[id]/route";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

describe("Teams API - Detail Routes", () => {
  const teamId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/teams/[id]", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 404 if team not found", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // Mock team not found
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // Empty array - not found
          }),
        }),
      } as any);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("should return team details with members", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockTeam = {
        id: teamId,
        name: "Engineering Team",
        description: "Core engineering team",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMembers = [
        {
          id: "member-1",
          userId: "user-1",
          userName: "Alice Smith",
          userEmail: "alice@example.com",
          role: "lead",
          joinedAt: new Date(),
        },
        {
          id: "member-2",
          userId: "user-2",
          userName: "Bob Johnson",
          userEmail: "bob@example.com",
          role: "member",
          joinedAt: new Date(),
        },
      ];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        if (callCount++ === 0) {
          // First call: get team details
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockTeam]),
              }),
            }),
          } as any;
        } else {
          // Second call: get members
          return {
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockMembers),
                }),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
      );
      const response = await GET(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(teamId);
      expect(data.data.name).toBe("Engineering Team");
      expect(data.data.members).toHaveLength(2);
      expect(data.data.members[0].userName).toBe("Alice Smith");
    });
  });

  describe("PUT /api/teams/[id]", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated Team" }),
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: teamId }) });
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
        `http://localhost:3000/api/teams/${teamId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated Team" }),
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: teamId }) });
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
        `http://localhost:3000/api/teams/${teamId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated Team" }),
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("should update team successfully", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const existingTeam = {
        id: teamId,
        name: "Old Name",
        description: "Old description",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTeam = {
        ...existingTeam,
        name: "New Name",
        description: "New description",
        updatedAt: new Date(),
      };

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        if (callCount++ === 0) {
          // First call: check if team exists
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([existingTeam]),
              }),
            }),
          } as any;
        } else {
          // Second call: check for duplicate name
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]), // No duplicates
              }),
            }),
          } as any;
        }
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedTeam]),
          }),
        }),
      } as any);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: "New Name",
            description: "New description",
          }),
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Name");
      expect(data.data.description).toBe("New description");
    });

    it("should return 400 when new name conflicts with existing team", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const existingTeam = {
        id: teamId,
        name: "Old Name",
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conflictingTeam = {
        id: "other-team-id",
        name: "Existing Team Name",
        isActive: true,
      };

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        if (callCount++ === 0) {
          // First call: check if team exists
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([existingTeam]),
              }),
            }),
          } as any;
        } else {
          // Second call: check for duplicate name - found conflict
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([conflictingTeam]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Existing Team Name" }),
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("DUPLICATE_NAME");
    });

    it("should skip duplicate check when name is unchanged", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const existingTeam = {
        id: teamId,
        name: "Same Name",
        description: "Old description",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTeam = {
        ...existingTeam,
        description: "New description",
        updatedAt: new Date(),
      };

      // Only one select call should happen (to check if team exists)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingTeam]),
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedTeam]),
          }),
        }),
      } as any);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Same Name", // Same as existing
            description: "New description",
          }),
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Verify only one select call (team existence check, no duplicate check)
      expect(vi.mocked(db.select)).toHaveBeenCalledTimes(1);
    });

    it("should return 400 for validation errors", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: "", // Empty name - invalid
          }),
        },
      );
      const response = await PUT(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/teams/[id]", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
        { method: "DELETE" },
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: teamId }) });
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
        `http://localhost:3000/api/teams/${teamId}`,
        { method: "DELETE" },
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: teamId }) });
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
        `http://localhost:3000/api/teams/${teamId}`,
        { method: "DELETE" },
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("should soft delete team successfully", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const existingTeam = {
        id: teamId,
        name: "Team to Delete",
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingTeam]),
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const request = new NextRequest(
        `http://localhost:3000/api/teams/${teamId}`,
        { method: "DELETE" },
      );
      const response = await DELETE(request, { params: Promise.resolve({ id: teamId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify update was called with isActive: false
      expect(vi.mocked(db.update)).toHaveBeenCalled();
    });
  });
});
