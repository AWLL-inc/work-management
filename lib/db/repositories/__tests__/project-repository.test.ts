import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/drizzle/schema";
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getProjectByName,
  projectNameExists,
  updateProject,
} from "../project-repository";

// Mock the database connection
vi.mock("@/lib/db/connection", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock drizzle-orm functions
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value, type: "eq" })),
  and: vi.fn((...conditions) => ({ conditions, type: "and" })),
}));

// Import mocked db after mocking
import { db } from "@/lib/db/connection";

describe("Project Repository", () => {
  const mockProject: Project = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Test Project",
    description: "A test project",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockProjects: Project[] = [
    mockProject,
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      name: "Another Project",
      description: "Another test project",
      isActive: true,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174002",
      name: "Inactive Project",
      description: "An inactive project",
      isActive: false,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllProjects", () => {
    it("should return all projects when activeOnly is false", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockProjects),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getAllProjects();

      expect(result).toEqual(mockProjects);
      expect(db.select).toHaveBeenCalled();
    });

    it("should return only active projects when activeOnly is true", async () => {
      const activeProjects = mockProjects.filter((p) => p.isActive);
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(activeProjects),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getAllProjects({ activeOnly: true });

      expect(result).toEqual(activeProjects);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.isActive)).toBe(true);
    });

    it("should handle empty result", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getAllProjects();

      expect(result).toEqual([]);
    });
  });

  describe("getProjectById", () => {
    it("should return project when found", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProject]),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getProjectById(mockProject.id);

      expect(result).toEqual(mockProject);
    });

    it("should return undefined when project not found", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getProjectById("non-existent-id");

      expect(result).toBeUndefined();
    });
  });

  describe("getProjectByName", () => {
    it("should return project when found by name", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProject]),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getProjectByName(mockProject.name);

      expect(result).toEqual(mockProject);
    });

    it("should return undefined when project not found by name", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getProjectByName("Non-existent Project");

      expect(result).toBeUndefined();
    });
  });

  describe("createProject", () => {
    it("should create and return a new project", async () => {
      const newProjectData = {
        name: "New Project",
        description: "A new project",
        isActive: true,
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "new-project-id",
              ...newProjectData,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      });
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any);

      const result = await createProject(newProjectData);

      expect(result).toBeDefined();
      expect(result.name).toBe(newProjectData.name);
      expect(result.description).toBe(newProjectData.description);
      expect(result.isActive).toBe(newProjectData.isActive);
      expect(db.insert).toHaveBeenCalled();
    });

    it("should create project with minimal data", async () => {
      const minimalData = {
        name: "Minimal Project",
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "minimal-project-id",
              ...minimalData,
              description: null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      });
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any);

      const result = await createProject(minimalData);

      expect(result).toBeDefined();
      expect(result.name).toBe(minimalData.name);
    });
  });

  describe("updateProject", () => {
    it("should update and return the project", async () => {
      const updateData = {
        name: "Updated Project",
        description: "Updated description",
      };

      const updatedProject = {
        ...mockProject,
        ...updateData,
        updatedAt: new Date(),
      };

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProject]),
          }),
        }),
      });
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any);

      const result = await updateProject(mockProject.id, updateData);

      expect(result).toEqual(updatedProject);
      expect(result?.name).toBe(updateData.name);
      expect(result?.description).toBe(updateData.description);
    });

    it("should return undefined when project not found", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any);

      const result = await updateProject("non-existent-id", {
        name: "Updated",
      });

      expect(result).toBeUndefined();
    });

    it("should update only isActive field", async () => {
      const updateData = { isActive: false };

      const updatedProject = {
        ...mockProject,
        ...updateData,
        updatedAt: new Date(),
      };

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProject]),
          }),
        }),
      });
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any);

      const result = await updateProject(mockProject.id, updateData);

      expect(result?.isActive).toBe(false);
    });
  });

  describe("deleteProject", () => {
    it("should soft delete the project (set isActive to false)", async () => {
      const deletedProject = {
        ...mockProject,
        isActive: false,
        updatedAt: new Date(),
      };

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deletedProject]),
          }),
        }),
      });
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any);

      const result = await deleteProject(mockProject.id);

      expect(result).toBeDefined();
      expect(result?.isActive).toBe(false);
    });

    it("should return undefined when project not found", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any);

      const result = await deleteProject("non-existent-id");

      expect(result).toBeUndefined();
    });
  });

  describe("projectNameExists", () => {
    it("should return true when project name exists", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: mockProject.id }]),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await projectNameExists(mockProject.name);

      expect(result).toBe(true);
    });

    it("should return false when project name does not exist", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await projectNameExists("Non-existent Project");

      expect(result).toBe(false);
    });

    it("should exclude specified ID when checking for duplicates", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await projectNameExists(mockProject.name, mockProject.id);

      expect(result).toBe(false);
    });
  });
});
