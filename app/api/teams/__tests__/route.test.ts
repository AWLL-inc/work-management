import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for Teams API (Collection Routes)
 * Tests GET and POST endpoints with authentication, authorization, and validation
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
      leftJoin: vi.fn(),
      groupBy: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      values: vi.fn(),
      returning: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
    },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual("drizzle-orm");
  return {
    ...actual,
    eq: vi.fn((field, value) => ({ field, value, op: "eq" })),
    and: vi.fn((...conditions) => ({ conditions, op: "and" })),
    count: vi.fn((field) => ({ field, op: "count" })),
    sql: vi.fn((strings, ...values) => ({ strings, values, op: "sql" })),
  };
});

import { GET, POST } from "@/app/api/teams/route";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

describe("Teams API - Collection Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/teams", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/teams");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return teams list for authenticated user", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockTeams = [
        {
          id: "team-1",
          name: "Team A",
          description: "Team A description",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          memberCount: 5,
        },
        {
          id: "team-2",
          name: "Team B",
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          memberCount: 3,
        },
      ];

      // Mock chained db calls
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockTeams),
              }),
            }),
          }),
        }),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/teams");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Team A");
      expect(data.data[0].memberCount).toBe(5);
    });

    it("should filter active teams when active=true query param", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockActiveTeams = [
        {
          id: "team-1",
          name: "Active Team",
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          memberCount: 2,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockActiveTeams),
              }),
            }),
          }),
        }),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/teams?active=true",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });
  });

  describe("POST /api/teams", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name: "New Team",
          description: "Team description",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 403 if user is not admin or manager", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name: "New Team",
          description: "Team description",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should create team when admin with valid data", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const newTeam = {
        id: "new-team-id",
        name: "New Team",
        description: "Team description",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock duplicate check
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No duplicates
          }),
        }),
      } as any);

      // Mock insert
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newTeam]),
        }),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name: "New Team",
          description: "Team description",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Team");
    });

    it("should allow manager to create team", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: {
          id: "manager-id",
          email: "manager@example.com",
          role: "manager",
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const newTeam = {
        id: "new-team-id",
        name: "Manager Team",
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newTeam]),
        }),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name: "Manager Team",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Manager Team");
    });

    it("should return 400 when team name already exists", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // Mock duplicate found
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "existing-team",
                name: "Existing Team",
                isActive: true,
              },
            ]),
          }),
        }),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name: "Existing Team",
          description: "This name exists",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("DUPLICATE_NAME");
    });

    it("should return 400 for validation errors", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name: "", // Empty name - invalid
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
