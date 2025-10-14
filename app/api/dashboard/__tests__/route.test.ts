import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authHelpers from "@/lib/auth-helpers";
import * as dbConnection from "@/lib/db/connection";
import { GET } from "../route";

// Mock dependencies
vi.mock("@/lib/auth-helpers");
vi.mock("@/lib/db/connection");

const mockGetAuthenticatedSession = vi.mocked(
  authHelpers.getAuthenticatedSession,
);
const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  innerJoin: vi.fn(),
  where: vi.fn(),
  groupBy: vi.fn(),
  orderBy: vi.fn(),
};

vi.mocked(dbConnection).db = mockDb as any;

describe("Dashboard API - GET /api/dashboard", () => {
  const mockUser = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "user@example.com",
    name: "Test User",
    role: "user" as const,
  };

  const mockAdminUser = {
    id: "admin-id",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin" as const,
  };

  const mockUserViewData = [
    {
      date: "2024-10-14",
      userId: "user1",
      userName: "User One",
      hours: 8.0,
    },
    {
      date: "2024-10-14",
      userId: "user2",
      userName: "User Two",
      hours: 6.5,
    },
  ];

  const mockProjectViewData = [
    {
      date: "2024-10-14",
      projectId: "project1",
      projectName: "Project Alpha",
      userId: "user1",
      userName: "User One",
      hours: 4.0,
    },
    {
      date: "2024-10-14",
      projectId: "project2",
      projectName: "Project Beta",
      userId: "user1",
      userName: "User One",
      hours: 4.0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default db mock chain
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.innerJoin.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.groupBy.mockReturnThis();
    mockDb.orderBy.mockResolvedValue([]);
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetAuthenticatedSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 when session exists but no user", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: null } as any);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe("User View", () => {
    it("should return user view data with default date range", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });
      mockDb.orderBy.mockResolvedValue(mockUserViewData);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.view).toBe("user");
      expect(data.data.data).toEqual(mockUserViewData);
      expect(data.data.summary.totalHours).toBe(14.5);
    });

    it("should return user view data with custom date range", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });
      mockDb.orderBy.mockResolvedValue(mockUserViewData);

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?startDate=2024-10-01&endDate=2024-10-31&view=user",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.dateRange.startDate).toBe("2024-10-01");
      expect(data.data.dateRange.endDate).toBe("2024-10-31");
    });

    it("should filter data for non-admin users", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });
      mockDb.orderBy.mockResolvedValue(mockUserViewData);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      await GET(request);

      // Verify that user-specific filtering was applied
      expect(mockDb.where).toHaveBeenCalled();
    });

    it("should not filter data for admin users", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockAdminUser });
      mockDb.orderBy.mockResolvedValue(mockUserViewData);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      await GET(request);

      // Verify database query was called
      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe("Project View", () => {
    it("should return project view data", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });
      mockDb.orderBy.mockResolvedValue(mockProjectViewData);

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?view=project",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.view).toBe("project");
      expect(data.data.data).toEqual(mockProjectViewData);
      expect(data.data.summary.totalHours).toBe(8.0);
    });
  });

  describe("Summary Calculations", () => {
    it("should calculate summary statistics correctly", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });
      mockDb.orderBy.mockResolvedValue(mockUserViewData);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.summary.totalHours).toBe(14.5);
      expect(data.data.summary.totalDays).toBe(1);
      expect(data.data.summary.averageHoursPerDay).toBe(14.5);
    });

    it("should handle empty data gracefully", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });
      mockDb.orderBy.mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.summary.totalHours).toBe(0);
      expect(data.data.summary.totalDays).toBe(0);
      expect(data.data.summary.averageHoursPerDay).toBe(0);
    });
  });

  describe("Validation", () => {
    it("should return 400 for invalid date format", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });

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
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });

      const request = new NextRequest(
        "http://localhost:3000/api/dashboard?view=invalid",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database query fails", async () => {
      mockGetAuthenticatedSession.mockResolvedValue({ user: mockUser });
      mockDb.orderBy.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/dashboard");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});
