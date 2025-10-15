import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type CreateProjectData,
  createProject,
  deleteProject,
  getProjects,
  type UpdateProjectData,
  updateProject,
} from "../projects";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("lib/api/projects", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getProjects", () => {
    const mockProjects = [
      {
        id: "1",
        name: "Project 1",
        description: "Description 1",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Project 2",
        description: "Description 2",
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("should fetch projects without filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockProjects,
        }),
      });

      const result = await getProjects();

      expect(mockFetch).toHaveBeenCalledWith("/api/projects");
      expect(result).toEqual(mockProjects);
    });

    it("should fetch active projects only", async () => {
      const activeProjects = mockProjects.filter((p) => p.isActive);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: activeProjects,
        }),
      });

      const result = await getProjects(true);

      expect(mockFetch).toHaveBeenCalledWith("/api/projects?active=true");
      expect(result).toEqual(activeProjects);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getProjects()).rejects.toThrow("Failed to fetch projects");
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Custom error" },
        }),
      });

      await expect(getProjects()).rejects.toThrow("Custom error");
    });

    it("should throw error when response success is false without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(getProjects()).rejects.toThrow("Failed to fetch projects");
    });

    it("should throw error when data is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      await expect(getProjects()).rejects.toThrow("Failed to fetch projects");
    });
  });

  describe("createProject", () => {
    const mockProject = {
      id: "1",
      name: "New Project",
      description: "New Description",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createData: CreateProjectData = {
      name: "New Project",
      description: "New Description",
      isActive: true,
    };

    it("should create project successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockProject,
        }),
      });

      const result = await createProject(createData);

      expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });
      expect(result).toEqual(mockProject);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Validation error" },
        }),
      });

      await expect(createProject(createData)).rejects.toThrow(
        "Validation error",
      );
    });

    it("should throw error when response is not ok without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(createProject(createData)).rejects.toThrow(
        "Failed to create project",
      );
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Server error" },
        }),
      });

      await expect(createProject(createData)).rejects.toThrow("Server error");
    });

    it("should throw error when data is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      await expect(createProject(createData)).rejects.toThrow(
        "Failed to create project",
      );
    });
  });

  describe("updateProject", () => {
    const projectId = "1";
    const mockProject = {
      id: projectId,
      name: "Updated Project",
      description: "Updated Description",
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateData: UpdateProjectData = {
      name: "Updated Project",
      description: "Updated Description",
      isActive: false,
    };

    it("should update project successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockProject,
        }),
      });

      const result = await updateProject(projectId, updateData);

      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockProject);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Not found" },
        }),
      });

      await expect(updateProject(projectId, updateData)).rejects.toThrow(
        "Not found",
      );
    });

    it("should throw error when response is not ok without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(updateProject(projectId, updateData)).rejects.toThrow(
        "Failed to update project",
      );
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Update failed" },
        }),
      });

      await expect(updateProject(projectId, updateData)).rejects.toThrow(
        "Update failed",
      );
    });

    it("should throw error when data is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      await expect(updateProject(projectId, updateData)).rejects.toThrow(
        "Failed to update project",
      );
    });
  });

  describe("deleteProject", () => {
    const projectId = "1";

    it("should delete project successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
        }),
      });

      await deleteProject(projectId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${projectId}`, {
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

      await expect(deleteProject(projectId)).rejects.toThrow("Not found");
    });

    it("should throw error when response is not ok without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(deleteProject(projectId)).rejects.toThrow(
        "Failed to delete project",
      );
    });

    it("should throw error when response success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { message: "Delete failed" },
        }),
      });

      await expect(deleteProject(projectId)).rejects.toThrow("Delete failed");
    });

    it("should throw error when response success is false without error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });

      await expect(deleteProject(projectId)).rejects.toThrow(
        "Failed to delete project",
      );
    });
  });
});
