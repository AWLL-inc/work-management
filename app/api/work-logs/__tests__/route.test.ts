import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for Work Logs API (Collection Routes)
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
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/auth-helpers", () => ({
  getAuthenticatedSession: vi.fn(),
}));
vi.mock("@/lib/db/repositories/work-log-repository", () => ({
  getWorkLogs: vi.fn(),
  createWorkLog: vi.fn(),
}));
vi.mock("@/lib/db/connection", () => ({
  db: {},
}));

import { GET, POST } from "@/app/api/work-logs/route";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createWorkLog,
  getWorkLogs,
} from "@/lib/db/repositories/work-log-repository";

describe("Work Logs API - Collection Routes", () => {
  const validProjectId = "550e8400-e29b-41d4-a716-446655440001";
  const validCategoryId = "550e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/work-logs", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/work-logs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return work logs for authenticated user", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockLogs = [
        {
          id: "log-1",
          userId: "user-id",
          date: new Date("2024-10-05"),
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
          details: "Daily work",
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: validProjectId,
            name: "Test Project",
            description: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          category: {
            id: validCategoryId,
            name: "Development",
            description: null,
            displayOrder: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          user: {
            id: "user-id",
            name: "Test User",
            email: "user@example.com",
            role: "user" as const,
            emailVerified: null,
            image: null,
            passwordHash: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const mockResponse = {
        data: mockLogs,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      vi.mocked(getWorkLogs).mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/work-logs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.pagination).toBeDefined();
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-id", // Non-admin should only see own logs
          page: 1,
          limit: 20,
        }),
      );
    });

    it("should allow admin to see all work logs with scope=all", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(getWorkLogs).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs?scope=all",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Admin with scope=all should not have userId filter
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.not.objectContaining({
          userId: expect.anything(),
        }),
      );
    });

    it("should support pagination parameters", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockResponse = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 50,
          totalPages: 5,
        },
      };

      vi.mocked(getWorkLogs).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs?page=2&limit=10",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        }),
      );
    });

    it("should return 400 for invalid pagination parameters", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs?page=0&limit=200",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should support date range filtering", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(getWorkLogs).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs?startDate=2024-10-01&endDate=2024-10-31",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      );
    });

    it("should support project filtering", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(getWorkLogs).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        `http://localhost:3000/api/work-logs?projectId=${validProjectId}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: validProjectId,
        }),
      );
    });

    describe("Advanced Filtering", () => {
      beforeEach(() => {
        vi.mocked(getAuthenticatedSession).mockResolvedValue({
          user: { id: "user-id", email: "user@example.com", role: "user" },
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        } as any);

        const mockResponse = {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        };
        vi.mocked(getWorkLogs).mockResolvedValue(mockResponse);
      });

      it("should filter by multiple project IDs", async () => {
        const projectIds = "proj1,proj2,proj3";
        const request = new NextRequest(
          `http://localhost:3000/api/work-logs?projectIds=${projectIds}`,
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            projectIds: ["proj1", "proj2", "proj3"],
          }),
        );
      });

      it("should filter by multiple category IDs", async () => {
        const categoryIds = "cat1,cat2";
        const request = new NextRequest(
          `http://localhost:3000/api/work-logs?categoryIds=${categoryIds}`,
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryIds: ["cat1", "cat2"],
          }),
        );
      });

      it("should filter by search text in details", async () => {
        const searchText = "meeting";
        const request = new NextRequest(
          `http://localhost:3000/api/work-logs?searchText=${searchText}`,
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: "meeting",
          }),
        );
      });

      it("should allow admin to filter by specific user with scope=all", async () => {
        vi.mocked(getAuthenticatedSession).mockResolvedValue({
          user: { id: "admin-id", email: "admin@example.com", role: "admin" },
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        } as any);

        const userId = "550e8400-e29b-41d4-a716-446655440000";
        const request = new NextRequest(
          `http://localhost:3000/api/work-logs?scope=all&userId=${userId}`,
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: "550e8400-e29b-41d4-a716-446655440000",
          }),
        );
      });

      it("should ignore userId filter for non-admin users", async () => {
        const userId = "550e8400-e29b-41d4-a716-446655440001";
        const request = new NextRequest(
          `http://localhost:3000/api/work-logs?userId=${userId}`,
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        // Non-admin should get their own userId, not the requested one
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: "user-id", // Current user, not requested user
          }),
        );
      });

      it("should combine multiple filters", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/work-logs?startDate=2024-01-01&endDate=2024-12-31&projectIds=proj1,proj2&searchText=development&page=2&limit=10",
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            projectIds: ["proj1", "proj2"],
            searchText: "development",
            page: 2,
            limit: 10,
            userId: "user-id",
          }),
        );
      });

      it("should return 400 for invalid date format", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/work-logs?startDate=invalid-date",
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe("VALIDATION_ERROR");
      });

      it("should handle empty projectIds parameter", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/work-logs?projectIds=",
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.not.objectContaining({
            projectIds: expect.anything(),
          }),
        );
      });

      it("should handle empty categoryIds parameter", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/work-logs?categoryIds=",
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.not.objectContaining({
            categoryIds: expect.anything(),
          }),
        );
      });

      it("should maintain backward compatibility with single projectId", async () => {
        const request = new NextRequest(
          `http://localhost:3000/api/work-logs?projectId=${validProjectId}`,
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: validProjectId,
          }),
        );
      });

      it("should maintain backward compatibility with single categoryId", async () => {
        const request = new NextRequest(
          `http://localhost:3000/api/work-logs?categoryId=${validCategoryId}`,
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(getWorkLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryId: validCategoryId,
          }),
        );
      });
    });
  });

  describe("POST /api/work-logs", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/work-logs", {
        method: "POST",
        body: JSON.stringify({
          date: "2024-10-05T10:00:00+09:00",
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should create work log with valid data", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockWorkLog = {
        id: "log-id",
        userId: "user-id",
        date: new Date("2024-10-05"),
        hours: "8.0",
        projectId: validProjectId,
        categoryId: validCategoryId,
        details: "Daily work",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createWorkLog).mockResolvedValue(mockWorkLog);

      const request = new NextRequest("http://localhost:3000/api/work-logs", {
        method: "POST",
        body: JSON.stringify({
          date: "2024-10-05T01:00:00Z",
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
          details: "Daily work",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.userId).toBe("user-id");
      expect(createWorkLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-id",
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
          details: "Daily work",
        }),
      );
    });

    it("should return 400 for invalid hours format", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/work-logs", {
        method: "POST",
        body: JSON.stringify({
          date: "2024-10-05T10:00:00+09:00",
          hours: "invalid", // Invalid hours format
          projectId: validProjectId,
          categoryId: validCategoryId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for hours exceeding 24", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/work-logs", {
        method: "POST",
        body: JSON.stringify({
          date: "2024-10-05T10:00:00+09:00",
          hours: "25.0", // Exceeds 24 hours
          projectId: validProjectId,
          categoryId: validCategoryId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for invalid project ID format", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/work-logs", {
        method: "POST",
        body: JSON.stringify({
          date: "2024-10-05T10:00:00+09:00",
          hours: "8.0",
          projectId: "not-a-uuid", // Invalid UUID
          categoryId: validCategoryId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for invalid date format", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/work-logs", {
        method: "POST",
        body: JSON.stringify({
          date: "invalid-date",
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should allow null details", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockWorkLog = {
        id: "log-id",
        userId: "user-id",
        date: new Date("2024-10-05"),
        hours: "8.0",
        projectId: validProjectId,
        categoryId: validCategoryId,
        details: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createWorkLog).mockResolvedValue(mockWorkLog);

      const request = new NextRequest("http://localhost:3000/api/work-logs", {
        method: "POST",
        body: JSON.stringify({
          date: "2024-10-05T01:00:00Z",
          hours: "8.0",
          projectId: validProjectId,
          categoryId: validCategoryId,
          // details not provided
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(createWorkLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: null,
        }),
      );
    });
  });

  describe("Scope Parameter", () => {
    const mockResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    beforeEach(() => {
      vi.mocked(getWorkLogs).mockResolvedValue(mockResponse);
    });

    it("should return only own work logs when scope=own (default)", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs?scope=own",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-id",
        }),
      );
    });

    it("should deny non-admin users from using scope=all", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs?scope=all",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
      expect(data.error.message).toBe("Only admins can view all work logs");
    });

    it("should allow admin to view all work logs with scope=all", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-logs?scope=all",
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

    it("should default to scope=own when no scope is specified", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/work-logs");
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should default to own scope
      expect(getWorkLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-id",
        }),
      );
    });
  });
});
