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

import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { GET } from "../route";

// Mock dependencies
vi.mock("@/lib/auth-helpers", () => ({
  getAuthenticatedSession: vi.fn(),
}));

vi.mock("@/lib/db/connection", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("/api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    });

    it("should return 400 for invalid date format", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "user",
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?startDate=invalid-date",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for invalid view parameter", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "user",
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?view=invalid",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should use default date range when dates not provided", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "user",
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      });

      const mockData = [
        {
          date: "2024-10-01",
          userId: "user-1",
          userName: "Test User",
          hours: 8,
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValueOnce(mockData),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.view).toBe("user");
      expect(data.data.dateRange).toBeDefined();
      expect(data.data.data).toEqual(mockData);
      expect(data.data.summary.totalHours).toBe(8);
    });

    it("should return user view data for regular users", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "user",
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      });

      const mockData = [
        {
          date: "2024-10-01",
          userId: "user-1",
          userName: "Test User",
          hours: 8,
        },
        {
          date: "2024-10-02",
          userId: "user-1",
          userName: "Test User",
          hours: 6,
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValueOnce(mockData),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?startDate=2024-10-01&endDate=2024-10-02&view=user",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.view).toBe("user");
      // Date ranges might be adjusted due to timezone handling in the route
      expect(data.data.dateRange.startDate).toMatch(
        /2024-09-3[01]|2024-10-0[12]/,
      );
      expect(data.data.dateRange.endDate).toMatch(/2024-10-0[123]/);
      expect(data.data.data).toEqual(mockData);
      expect(data.data.summary.totalHours).toBe(14);
      expect(data.data.summary.totalDays).toBe(2);
      expect(data.data.summary.averageHoursPerDay).toBe(7);
    });

    it("should return project view data", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "admin",
          name: "Admin User",
          email: "admin@example.com",
        },
        expires: "2024-12-31",
      });

      const mockData = [
        {
          date: "2024-10-01",
          projectId: "project-1",
          projectName: "Project A",
          userId: "user-1",
          userName: "Test User",
          hours: 8,
        },
        {
          date: "2024-10-01",
          projectId: "project-2",
          projectName: "Project B",
          userId: "user-1",
          userName: "Test User",
          hours: 4,
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValueOnce(mockData),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?startDate=2024-10-01&endDate=2024-10-01&view=project",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.view).toBe("project");
      expect(data.data.data).toEqual(mockData);
      expect(data.data.summary.totalHours).toBe(12);
      expect(data.data.summary.totalDays).toBe(1);
      expect(data.data.summary.averageHoursPerDay).toBe(12);
    });

    it("should return all user data for admin users", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "admin-1",
          role: "admin",
          name: "Admin User",
          email: "admin@example.com",
        },
        expires: "2024-12-31",
      });

      const mockData = [
        {
          date: "2024-10-01",
          userId: "user-1",
          userName: "User One",
          hours: 8,
        },
        {
          date: "2024-10-01",
          userId: "user-2",
          userName: "User Two",
          hours: 7,
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValueOnce(mockData),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?startDate=2024-10-01&endDate=2024-10-01",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual(mockData);
      expect(data.data.summary.totalHours).toBe(15);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "user",
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      });

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi
          .fn()
          .mockRejectedValueOnce(new Error("Database connection failed")),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(data.error.message).toBe("Failed to fetch dashboard data");
      expect(data.error.details).toBe("Database connection failed");
    });

    it("should calculate summary correctly with empty data", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: {
          id: "user-1",
          role: "user",
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      });

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValueOnce([]),
      };

      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual([]);
      expect(data.data.summary.totalHours).toBe(0);
      expect(data.data.summary.totalDays).toBe(0);
      expect(data.data.summary.averageHoursPerDay).toBe(0);
    });
  });
});
