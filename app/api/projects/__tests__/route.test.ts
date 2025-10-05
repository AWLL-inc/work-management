import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { GET, POST } from "../route";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock the repository
vi.mock("@/lib/db/repositories/project-repository", () => ({
  getAllProjects: vi.fn(),
  createProject: vi.fn(),
  projectNameExists: vi.fn(),
}));

// Mock validations
vi.mock("@/lib/validations", async () => {
  const actual = await vi.importActual("@/lib/validations");
  return {
    ...actual,
    listProjectsQuerySchema: {
      parse: vi.fn(),
    },
  };
});

import { auth } from "@/lib/auth";
import {
  createProject,
  getAllProjects,
  projectNameExists,
} from "@/lib/db/repositories/project-repository";
import { listProjectsQuerySchema } from "@/lib/validations";

describe("GET /api/projects", () => {
  const mockProjects = [
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test Project",
      description: "A test project",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      name: "Another Project",
      description: "Another test project",
      isActive: true,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for listProjectsQuerySchema
    vi.mocked(listProjectsQuerySchema.parse).mockImplementation(
      (data: any) => ({
        active: data.active === "true",
      }),
    );
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest("http://localhost:3000/api/projects");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return all projects when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getAllProjects).mockResolvedValue(mockProjects);

    const request = new NextRequest("http://localhost:3000/api/projects");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].name).toBe("Test Project");
    expect(data.data[1].name).toBe("Another Project");
    expect(getAllProjects).toHaveBeenCalledWith({ activeOnly: false });
  });

  it("should filter active projects when active=true", async () => {
    const activeProjects = mockProjects.filter((p) => p.isActive);
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getAllProjects).mockResolvedValue(activeProjects);

    const request = new NextRequest(
      "http://localhost:3000/api/projects?active=true",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(getAllProjects).toHaveBeenCalledWith({ activeOnly: true });
  });

  it("should return 400 for validation error in query parameters", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    // Mock ZodError
    const zodError = new ZodError([
      {
        code: "invalid_type",
        expected: "boolean",
        received: "string",
        path: ["active"],
        message: "Invalid query parameter",
      } as any,
    ]);
    vi.mocked(listProjectsQuerySchema.parse).mockImplementation(() => {
      throw zodError;
    });

    const request = new NextRequest(
      "http://localhost:3000/api/projects?active=invalid",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
    expect(data.error.message).toBe("Invalid query parameters");
  });

  it("should return 500 when repository throws error", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getAllProjects).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/projects");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("POST /api/projects", () => {
  const mockProject = {
    id: "new-project-id",
    name: "New Project",
    description: "A new project",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock for POST tests
    vi.mocked(listProjectsQuerySchema.parse).mockImplementation(
      (data: any) => ({
        active: data.active === "true",
      }),
    );
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "New Project",
        description: "A new project",
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 when user is not admin", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "New Project",
        description: "A new project",
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("should create project when admin with valid data", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(projectNameExists).mockResolvedValue(false);
    vi.mocked(createProject).mockResolvedValue(mockProject);

    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "New Project",
        description: "A new project",
        isActive: true,
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(mockProject.name);
    expect(data.data.description).toBe(mockProject.description);
    expect(data.data.isActive).toBe(mockProject.isActive);
    expect(projectNameExists).toHaveBeenCalledWith("New Project");
    expect(createProject).toHaveBeenCalledWith({
      name: "New Project",
      description: "A new project",
      isActive: true,
    });
  });

  it("should return 400 when validation fails", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "", // Invalid: empty name
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when project name already exists", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(projectNameExists).mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Existing Project",
        description: "This name already exists",
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("DUPLICATE_NAME");
  });

  it("should return 500 when repository throws error", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(projectNameExists).mockResolvedValue(false);
    vi.mocked(createProject).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "New Project",
        description: "A new project",
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
