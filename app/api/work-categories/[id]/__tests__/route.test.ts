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

import { DELETE, PUT } from "../route";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock the repository
vi.mock("@/lib/db/repositories/work-category-repository", () => ({
  getWorkCategoryById: vi.fn(),
  updateWorkCategory: vi.fn(),
  deleteWorkCategory: vi.fn(),
  workCategoryNameExists: vi.fn(),
}));

import { auth } from "@/lib/auth";
import {
  deleteWorkCategory,
  getWorkCategoryById,
  updateWorkCategory,
  workCategoryNameExists,
} from "@/lib/db/repositories/work-category-repository";

describe("PUT /api/work-categories/[id]", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  const mockCategory = {
    id: validUuid,
    name: "Development",
    description: "Development work",
    displayOrder: 0,
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
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Category" }),
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
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Category" }),
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
      `http://localhost:3000/api/work-categories/${invalidId}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Category" }),
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

  it("should return 404 when work category not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkCategoryById).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Category" }),
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

  it("should update work category successfully", async () => {
    const updatedCategory = {
      ...mockCategory,
      name: "Updated Category",
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
    vi.mocked(getWorkCategoryById).mockResolvedValue(mockCategory);
    vi.mocked(workCategoryNameExists).mockResolvedValue(false);
    vi.mocked(updateWorkCategory).mockResolvedValue(updatedCategory);

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Category" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Updated Category");
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
    vi.mocked(getWorkCategoryById).mockResolvedValue(mockCategory);
    vi.mocked(workCategoryNameExists).mockResolvedValue(true);

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Existing Category" }),
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

  it("should update displayOrder successfully", async () => {
    const updatedCategory = {
      ...mockCategory,
      displayOrder: 5,
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
    vi.mocked(getWorkCategoryById).mockResolvedValue(mockCategory);
    vi.mocked(updateWorkCategory).mockResolvedValue(updatedCategory);

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ displayOrder: 5 }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.displayOrder).toBe(5);
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
    vi.mocked(getWorkCategoryById).mockResolvedValue(mockCategory);

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
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
    vi.mocked(getWorkCategoryById).mockRejectedValue(
      new Error("Database error"),
    );

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Category" }),
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

describe("DELETE /api/work-categories/[id]", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  const mockCategory = {
    id: validUuid,
    name: "Development",
    description: "Development work",
    displayOrder: 0,
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
      `http://localhost:3000/api/work-categories/${validUuid}`,
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
      `http://localhost:3000/api/work-categories/${validUuid}`,
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
      `http://localhost:3000/api/work-categories/${invalidId}`,
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

  it("should return 404 when work category not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkCategoryById).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
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

  it("should soft delete work category successfully", async () => {
    const deletedCategory = {
      ...mockCategory,
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
    vi.mocked(getWorkCategoryById).mockResolvedValue(mockCategory);
    vi.mocked(deleteWorkCategory).mockResolvedValue(deletedCategory);

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expect(deleteWorkCategory).toHaveBeenCalledWith(validUuid);
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
    vi.mocked(getWorkCategoryById).mockRejectedValue(
      new Error("Database error"),
    );

    const request = new NextRequest(
      `http://localhost:3000/api/work-categories/${validUuid}`,
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
