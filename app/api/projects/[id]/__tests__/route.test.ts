import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PUT } from "../route";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock the repository
vi.mock("@/lib/db/repositories/project-repository", () => ({
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  projectNameExists: vi.fn(),
}));

import { auth } from "@/lib/auth";
import {
  deleteProject,
  getProjectById,
  projectNameExists,
  updateProject,
} from "@/lib/db/repositories/project-repository";

describe("PUT /api/projects/[id]", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  const mockProject = {
    id: validUuid,
    name: "Test Project",
    description: "A test project",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Project" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
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

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Project" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("should return 400 for invalid UUID format", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const invalidId = "invalid-uuid";
    const request = new NextRequest(
      `http://localhost:3000/api/projects/${invalidId}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Project" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: invalidId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_ID");
  });

  it("should return 404 when project not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getProjectById).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Project" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("should update project successfully", async () => {
    const updatedProject = {
      ...mockProject,
      name: "Updated Project",
      updatedAt: new Date(),
    };

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getProjectById).mockResolvedValue(mockProject);
    vi.mocked(projectNameExists).mockResolvedValue(false);
    vi.mocked(updateProject).mockResolvedValue(updatedProject);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Project" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Updated Project");
  });

  it("should return 400 when name already exists", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getProjectById).mockResolvedValue(mockProject);
    vi.mocked(projectNameExists).mockResolvedValue(true);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Existing Project" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("DUPLICATE_NAME");
  });

  it("should return 400 for validation errors", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getProjectById).mockResolvedValue(mockProject);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "" }), // Invalid: empty name
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
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
    vi.mocked(getProjectById).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Project" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("DELETE /api/projects/[id]", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  const mockProject = {
    id: validUuid,
    name: "Test Project",
    description: "A test project",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
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

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("should return 400 for invalid UUID format", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const invalidId = "invalid-uuid";
    const request = new NextRequest(
      `http://localhost:3000/api/projects/${invalidId}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: invalidId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_ID");
  });

  it("should return 404 when project not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getProjectById).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("should soft delete project successfully", async () => {
    const deletedProject = {
      ...mockProject,
      isActive: false,
      updatedAt: new Date(),
    };

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getProjectById).mockResolvedValue(mockProject);
    vi.mocked(deleteProject).mockResolvedValue(deletedProject);

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expect(deleteProject).toHaveBeenCalledWith(validUuid);
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
    vi.mocked(getProjectById).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      `http://localhost:3000/api/projects/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
