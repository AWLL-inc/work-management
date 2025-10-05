import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for Work Categories API (Collection Routes)
 * Tests GET and POST endpoints with authentication, authorization, and validation
 */

// Mock dependencies - must be before imports
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/db/repositories/work-category-repository", () => ({
  getAllWorkCategories: vi.fn(),
  createWorkCategory: vi.fn(),
  workCategoryNameExists: vi.fn(),
}));

import { GET, POST } from "@/app/api/work-categories/route";
import { auth } from "@/lib/auth";
import {
  createWorkCategory,
  getAllWorkCategories,
  workCategoryNameExists,
} from "@/lib/db/repositories/work-category-repository";

describe("Work Categories API - Collection Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/work-categories", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return all active work categories when active=true", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const mockCategories = [
        {
          id: "cat-1",
          name: "Development",
          description: "Development work",
          displayOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "cat-2",
          name: "Meeting",
          description: "Meetings",
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(getAllWorkCategories).mockResolvedValue(mockCategories);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories?active=true",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(getAllWorkCategories).toHaveBeenCalledWith({
        activeOnly: true,
      });
    });

    it("should return all work categories when active=false", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(getAllWorkCategories).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories?active=false",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getAllWorkCategories).toHaveBeenCalledWith({
        activeOnly: false,
      });
    });

    it("should handle validation errors in query parameters", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // This shouldn't cause an error as the schema transforms invalid values to false
      const request = new NextRequest(
        "http://localhost:3000/api/work-categories?active=invalid",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("POST /api/work-categories", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "New Category",
            description: "Test category",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 403 if user is not admin", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-id", email: "user@example.com", role: "user" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "New Category",
            description: "Test category",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should create work category with valid data", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(workCategoryNameExists).mockResolvedValue(false);

      const mockCategory = {
        id: "cat-id",
        name: "New Category",
        description: "Test category",
        displayOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createWorkCategory).mockResolvedValue(mockCategory);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "New Category",
            description: "Test category",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Category");
    });

    it("should return 400 for duplicate category name", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(workCategoryNameExists).mockResolvedValue(true);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Existing Category",
            description: "Test category",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("DUPLICATE_NAME");
    });

    it("should return 400 for invalid request data", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "", // Empty name should fail validation
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should apply default values for optional fields", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin-id", email: "admin@example.com", role: "admin" },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      vi.mocked(workCategoryNameExists).mockResolvedValue(false);

      const mockCategory = {
        id: "cat-id",
        name: "Category",
        description: null,
        displayOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createWorkCategory).mockResolvedValue(mockCategory);

      const request = new NextRequest(
        "http://localhost:3000/api/work-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Category",
            // description, displayOrder, isActive not provided - should use defaults
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(createWorkCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Category",
          isActive: true,
          displayOrder: 0,
        }),
      );
    });
  });
});
