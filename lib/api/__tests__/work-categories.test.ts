import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getWorkCategories,
  createWorkCategory,
  updateWorkCategory,
  deleteWorkCategory,
  type CreateWorkCategoryData,
  type UpdateWorkCategoryData,
} from "../work-categories";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("lib/api/work-categories", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getWorkCategories", () => {
    const mockWorkCategories = [
      {
        id: "1",
        name: "Development",
        description: "Software development tasks",
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Meeting",
        description: "Team meetings",
        displayOrder: 2,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("should fetch work categories without filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockWorkCategories,
        }),
      });

      const result = await getWorkCategories();

      expect(mockFetch).toHaveBeenCalledWith("/api/work-categories");
      expect(result).toEqual(mockWorkCategories);
    });

    it("should fetch active work categories only", async () => {
      const activeCategories = mockWorkCategories.filter((c) => c.isActive);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: activeCategories,
        }),
      });

      const result = await getWorkCategories(true);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-categories?active=true");
      expect(result).toEqual(activeCategories);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getWorkCategories()).rejects.toThrow("Failed to fetch work categories");
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Custom error" },
        }),
      });

      await expect(getWorkCategories()).rejects.toThrow("Custom error");
    });

    it("should throw error when response success is false without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(getWorkCategories()).rejects.toThrow("Failed to fetch work categories");
    });

    it("should throw error when data is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      await expect(getWorkCategories()).rejects.toThrow("Failed to fetch work categories");
    });
  });

  describe("createWorkCategory", () => {
    const mockWorkCategory = {
      id: "1",
      name: "Testing",
      description: "Quality assurance tasks",
      displayOrder: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createData: CreateWorkCategoryData = {
      name: "Testing",
      description: "Quality assurance tasks",
      displayOrder: 3,
      isActive: true,
    };

    it("should create work category successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockWorkCategory,
        }),
      });

      const result = await createWorkCategory(createData);

      expect(mockFetch).toHaveBeenCalledWith("/api/work-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });
      expect(result).toEqual(mockWorkCategory);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Validation error" },
        }),
      });

      await expect(createWorkCategory(createData)).rejects.toThrow("Validation error");
    });

    it("should throw error when response is not ok without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(createWorkCategory(createData)).rejects.toThrow("Failed to create work category");
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Server error" },
        }),
      });

      await expect(createWorkCategory(createData)).rejects.toThrow("Server error");
    });

    it("should throw error when data is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      await expect(createWorkCategory(createData)).rejects.toThrow("Failed to create work category");
    });
  });

  describe("updateWorkCategory", () => {
    const categoryId = "1";
    const mockWorkCategory = {
      id: categoryId,
      name: "Updated Testing",
      description: "Updated description",
      displayOrder: 5,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateData: UpdateWorkCategoryData = {
      name: "Updated Testing",
      description: "Updated description",
      displayOrder: 5,
      isActive: false,
    };

    it("should update work category successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockWorkCategory,
        }),
      });

      const result = await updateWorkCategory(categoryId, updateData);

      expect(mockFetch).toHaveBeenCalledWith(`/api/work-categories/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockWorkCategory);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Not found" },
        }),
      });

      await expect(updateWorkCategory(categoryId, updateData)).rejects.toThrow("Not found");
    });

    it("should throw error when response is not ok without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(updateWorkCategory(categoryId, updateData)).rejects.toThrow("Failed to update work category");
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Update failed" },
        }),
      });

      await expect(updateWorkCategory(categoryId, updateData)).rejects.toThrow("Update failed");
    });

    it("should throw error when data is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      await expect(updateWorkCategory(categoryId, updateData)).rejects.toThrow("Failed to update work category");
    });
  });

  describe("deleteWorkCategory", () => {
    const categoryId = "1";

    it("should delete work category successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
        }),
      });

      await deleteWorkCategory(categoryId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/work-categories/${categoryId}`, {
        method: "DELETE",
      });
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Not found" },
        }),
      });

      await expect(deleteWorkCategory(categoryId)).rejects.toThrow("Not found");
    });

    it("should throw error when response is not ok without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(deleteWorkCategory(categoryId)).rejects.toThrow("Failed to delete work category");
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Delete failed" },
        }),
      });

      await expect(deleteWorkCategory(categoryId)).rejects.toThrow("Delete failed");
    });

    it("should throw error when response success is false without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(deleteWorkCategory(categoryId)).rejects.toThrow("Failed to delete work category");
    });
  });
});