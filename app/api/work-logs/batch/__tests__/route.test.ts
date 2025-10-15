import { describe, it, expect, beforeEach, vi } from "vitest";
import { PUT } from "../route";
import { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  batchUpdateWorkLogs,
  isWorkLogOwner,
} from "@/lib/db/repositories/work-log-repository";

// Mock dependencies
vi.mock("@/lib/auth-helpers", () => ({
  getAuthenticatedSession: vi.fn(),
}));

vi.mock("@/lib/db/repositories/work-log-repository", () => ({
  batchUpdateWorkLogs: vi.fn(),
  isWorkLogOwner: vi.fn(),
}));

describe("/api/work-logs/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PUT", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    });

    it("should return 400 for invalid request body", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify({ invalid: "data" }),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request data");
    });

    it("should return 400 for invalid work log data", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "not-a-uuid",
            data: { hours: "invalid" },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 403 when non-admin user tries to update others' work logs", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(isWorkLogOwner).mockResolvedValueOnce(false);

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            data: { hours: "8" },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: { code: "FORBIDDEN", message: "You can only update your own work logs" },
      });
      expect(isWorkLogOwner).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "user-1"
      );
    });

    it("should allow regular users to update their own work logs", async () => {
      const mockWorkLogs = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          date: "2024-10-01T00:00:00.000Z",
          hours: "8",
          projectId: "proj-1",
          categoryId: "cat-1",
          details: "Updated work",
          userId: "user-1",
        },
      ];

      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(isWorkLogOwner).mockResolvedValueOnce(true);
      vi.mocked(batchUpdateWorkLogs).mockResolvedValueOnce(mockWorkLogs);

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            data: {
              date: "2024-10-01",
              hours: "8",
              details: "Updated work",
            },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWorkLogs);
      expect(isWorkLogOwner).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "user-1"
      );
    });

    it("should allow admin users to update any work logs", async () => {
      const mockWorkLogs = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          date: "2024-10-01T00:00:00.000Z",
          hours: "8",
          projectId: "proj-1",
          categoryId: "cat-1",
          details: "Admin updated",
          userId: "user-2",
        },
      ];

      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "admin-1", role: "admin", name: "Admin User", email: "admin@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(batchUpdateWorkLogs).mockResolvedValueOnce(mockWorkLogs);

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            data: {
              date: "2024-10-01",
              hours: "8",
              details: "Admin updated",
            },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWorkLogs);
      expect(isWorkLogOwner).not.toHaveBeenCalled(); // Admin bypasses ownership check
    });

    it("should handle multiple work log updates", async () => {
      const mockWorkLogs = [
        {
          id: "123e4567-e89b-12d3-a456-426614174001",
          date: "2024-10-01T00:00:00.000Z",
          hours: "8",
          projectId: "proj-1",
          categoryId: "cat-1",
          details: null,
          userId: "user-1",
        },
        {
          id: "123e4567-e89b-12d3-a456-426614174002",
          date: "2024-10-02T00:00:00.000Z",
          hours: "6",
          projectId: "proj-2",
          categoryId: "cat-2",
          details: null,
          userId: "user-1",
        },
      ];

      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(isWorkLogOwner).mockResolvedValue(true);
      vi.mocked(batchUpdateWorkLogs).mockResolvedValueOnce(mockWorkLogs);

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174001",
            data: { hours: "8" },
          },
          {
            id: "123e4567-e89b-12d3-a456-426614174002",
            data: { hours: "6" },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWorkLogs);
      expect(isWorkLogOwner).toHaveBeenCalledTimes(2);
    });

    it("should handle partial updates correctly", async () => {
      const mockWorkLogs = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          date: new Date("2024-10-01"),
          hours: "10",
          projectId: "proj-1",
          categoryId: "cat-1",
          details: null,
          userId: "user-1",
        },
      ];

      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(isWorkLogOwner).mockResolvedValueOnce(true);
      vi.mocked(batchUpdateWorkLogs).mockResolvedValueOnce(mockWorkLogs);

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            data: { hours: "10" }, // Only updating hours
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(batchUpdateWorkLogs).toHaveBeenCalledWith([
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          data: { hours: "10" },
        },
      ]);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(isWorkLogOwner).mockResolvedValueOnce(true);
      vi.mocked(batchUpdateWorkLogs).mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            data: { hours: "8" },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.message).toBe("An error occurred while updating work logs");
    });

    it("should include error details in development mode", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(isWorkLogOwner).mockResolvedValueOnce(true);
      vi.mocked(batchUpdateWorkLogs).mockRejectedValueOnce(
        new Error("Detailed database error")
      );

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            data: { hours: "8" },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.details).toBe("Detailed database error");

      process.env.NODE_ENV = originalEnv;
    });

    it("should transform date strings to Date objects", async () => {
      const mockWorkLogs = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          date: "2024-10-05T00:00:00.000Z",
          hours: "8",
          projectId: "123e4567-e89b-12d3-a456-426614174001",
          categoryId: "123e4567-e89b-12d3-a456-426614174002",
          details: null,
          userId: "user-1",
        },
      ];

      vi.mocked(getAuthenticatedSession).mockResolvedValueOnce({
        user: { id: "user-1", role: "user", name: "Test User", email: "test@example.com" },
        expires: "2024-12-31",
      });
      vi.mocked(isWorkLogOwner).mockResolvedValueOnce(true);
      vi.mocked(batchUpdateWorkLogs).mockResolvedValueOnce(mockWorkLogs);

      const request = new NextRequest("http://localhost:3000/api/work-logs/batch", {
        method: "PUT",
        body: JSON.stringify([
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            data: {
              date: "2024-10-05",
              projectId: "123e4567-e89b-12d3-a456-426614174001",
              categoryId: "123e4567-e89b-12d3-a456-426614174002",
              hours: "8",
            },
          },
        ]),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(batchUpdateWorkLogs).toHaveBeenCalledWith([
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          data: {
            date: new Date("2024-10-05"),
            projectId: "123e4567-e89b-12d3-a456-426614174001",
            categoryId: "123e4567-e89b-12d3-a456-426614174002",
            hours: "8",
          },
        },
      ]);
    });
  });
});