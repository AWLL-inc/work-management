import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for Work Logs CSV Export API
 * Tests GET endpoint with authentication, authorization, and validation
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
vi.mock("@/lib/db/repositories/work-log-repository", () => ({
  getWorkLogs: vi.fn(),
}));

vi.mock("@/lib/db/connection", () => {
  const selectFn = vi.fn().mockReturnThis();
  const fromFn = vi.fn().mockReturnThis();
  const whereFn = vi.fn().mockReturnThis();
  const innerJoinFn = vi.fn().mockReturnThis();
  const limitFn = vi.fn().mockResolvedValue([]);

  const mockDb = {
    select: selectFn,
    from: fromFn,
    where: whereFn,
    innerJoin: innerJoinFn,
    limit: limitFn,
  };

  return { db: mockDb };
});

import { GET } from "@/app/api/work-logs/export/route";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { getWorkLogs } from "@/lib/db/repositories/work-log-repository";

describe("Work Logs CSV Export API", () => {
  const validProjectId = "550e8400-e29b-41d4-a716-446655440001";
  const validCategoryId = "550e8400-e29b-41d4-a716-446655440002";
  const validUserId = "550e8400-e29b-41d4-a716-446655440003";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/work-logs/export", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Unauthorized");
    });

    it("should return 400 if date range is not specified", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Start date and end date are required");
    });

    it("should return 400 if only start date is provided", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Start date and end date are required");
    });

    it("should return 400 if date range exceeds 31 days", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-12-31",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe(
        "Date range cannot exceed 31 days (1 month)",
      );
    });

    it("should return 400 if start date is after end date", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-31&to=2024-01-01",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe(
        "Start date must be before or equal to end date",
      );
    });

    it("should return 400 for invalid date format", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=invalid&to=2024-01-31",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Invalid date format. Use YYYY-MM-DD");
    });

    it("should return 403 if non-admin tries to use scope=all", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31&scope=all",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe(
        "Forbidden: Only admins can export all users' work logs",
      );
    });

    it("should return 403 if non-admin tries to export other user's data", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        `http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31&userId=${validUserId}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe(
        "Forbidden: You can only export your own work logs",
      );
    });

    it("should export CSV for authenticated user with valid date range", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockLogs = [
        {
          id: "log-1",
          userId: "user-id",
          date: new Date("2024-01-15"),
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
          details: "Daily work",
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: validProjectId,
            name: "Test Project",
          },
          category: {
            id: validCategoryId,
            name: "Development",
          },
          user: {
            id: "user-id",
            name: "Test User",
            email: "user@example.com",
          },
        },
      ];

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: mockLogs,
        pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/csv; charset=utf-8",
      );
      expect(response.headers.get("Content-Disposition")).toContain(
        "attachment",
      );
      expect(response.headers.get("Content-Disposition")).toContain(
        "work-logs-2024-01-01_2024-01-31.csv",
      );

      const text = await response.text();
      expect(text).toContain("日付,ユーザー,工数,プロジェクト,カテゴリ,詳細");
      expect(text).toContain("2024-01-15");
      expect(text).toContain("Test User");
      expect(text).toContain("8.0");
      expect(text).toContain("Test Project");
      expect(text).toContain("Development");
      expect(text).toContain("Daily work");

      // Check BOM
      expect(text.charCodeAt(0)).toBe(0xfeff);
    });

    it("should support project filtering", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10000, total: 0, totalPages: 0 },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31&projects=${validProjectId}`,
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          projectIds: [validProjectId],
        }),
      );
    });

    it("should support category filtering", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10000, total: 0, totalPages: 0 },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31&categories=${validCategoryId}`,
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryIds: [validCategoryId],
        }),
      );
    });

    it("should allow admin to export with scope=all", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10000, total: 0, totalPages: 0 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31&scope=all",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Admin with scope=all should not have userId filter
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.not.objectContaining({
          userId: expect.anything(),
        }),
      );
    });

    it("should support scope=team with team members", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10000, total: 0, totalPages: 0 },
      });

      // Mock team membership queries
      const userTeams = [{ teamId: "team-1" }];
      const allMembers = [{ userId: "user-id" }, { userId: "teammate-1" }];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        const mockChain = {
          from: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue(callCount++ === 0 ? userTeams : allMembers),
          }),
        };
        return mockChain as any;
      });

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31&scope=team",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: expect.arrayContaining(["user-id", "teammate-1"]),
        }),
      );
    });

    it("should escape special characters in CSV", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockLogs = [
        {
          id: "log-1",
          userId: "user-id",
          date: new Date("2024-01-15"),
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
          details: 'Work with "quotes" and, commas',
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: validProjectId,
            name: "Project, with comma",
          },
          category: {
            id: validCategoryId,
            name: "Development",
          },
          user: {
            id: "user-id",
            name: "Test User",
            email: "user@example.com",
          },
        },
      ];

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: mockLogs,
        pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31",
      );
      const response = await GET(request);
      const text = await response.text();

      // Quotes should be escaped
      expect(text).toContain('"Work with ""quotes"" and, commas"');
      expect(text).toContain('"Project, with comma"');
    });

    it("should handle null details gracefully", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockLogs = [
        {
          id: "log-1",
          userId: "user-id",
          date: new Date("2024-01-15"),
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
          details: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: validProjectId,
            name: "Test Project",
          },
          category: {
            id: validCategoryId,
            name: "Development",
          },
          user: {
            id: "user-id",
            name: "Test User",
            email: "user@example.com",
          },
        },
      ];

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: mockLogs,
        pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-01-31",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const text = await response.text();
      // Null details should result in empty field at the end
      expect(text).toContain(
        "2024-01-15,Test User,8.0,Test Project,Development,",
      );
    });

    it("should export with exactly 31 days period", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(getWorkLogs).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10000, total: 0, totalPages: 0 },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs/export?from=2024-01-01&to=2024-02-01",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-02-01"),
          limit: 10000,
        }),
      );
    });
  });
});
