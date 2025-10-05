import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PUT } from "../route";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock the repository
vi.mock("@/lib/db/repositories/work-log-repository", () => ({
  getWorkLogById: vi.fn(),
  updateWorkLog: vi.fn(),
  deleteWorkLog: vi.fn(),
  isWorkLogOwner: vi.fn(),
}));

import { auth } from "@/lib/auth";
import {
  deleteWorkLog,
  getWorkLogById,
  isWorkLogOwner,
  updateWorkLog,
} from "@/lib/db/repositories/work-log-repository";

describe("PUT /api/work-logs/[id]", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  const validProjectId = "550e8400-e29b-41d4-a716-446655440001";
  const validCategoryId = "550e8400-e29b-41d4-a716-446655440002";

  const mockWorkLog = {
    id: validUuid,
    userId: "user-id",
    date: new Date("2024-10-05"),
    hours: "8.0",
    projectId: validProjectId,
    categoryId: validCategoryId,
    details: "Daily work",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    project: {
      id: validProjectId,
      name: "Test Project",
      description: null,
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    category: {
      id: validCategoryId,
      name: "Development",
      description: null,
      displayOrder: 0,
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    user: {
      id: "user-id",
      name: "Test User",
      email: "user@example.com",
      role: "user" as const,
      emailVerified: null,
      image: null,
      passwordHash: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: 7.5 }),
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

  it("should return 400 for invalid UUID format", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const invalidId = "invalid-uuid";
    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${invalidId}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: 7.5 }),
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

  it("should return 404 when work log not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: 7.5 }),
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

  it("should return 403 when non-admin user tries to update others work log", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "other-user-id",
        email: "other@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(mockWorkLog);
    vi.mocked(isWorkLogOwner).mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: 7.5 }),
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

  it("should allow user to update their own work log", async () => {
    const updatedWorkLog = {
      ...mockWorkLog,
      hours: "7.5",
      updatedAt: new Date(),
    };

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(mockWorkLog);
    vi.mocked(isWorkLogOwner).mockResolvedValue(true);
    vi.mocked(updateWorkLog).mockResolvedValue(updatedWorkLog);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: "7.5" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.hours).toBe("7.5");
  });

  it("should allow admin to update any work log", async () => {
    const updatedWorkLog = {
      ...mockWorkLog,
      hours: "7.5",
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
    vi.mocked(getWorkLogById).mockResolvedValue(mockWorkLog);
    vi.mocked(updateWorkLog).mockResolvedValue(updatedWorkLog);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: "7.5" }),
      },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.hours).toBe("7.5");
    // Admin should not need ownership check
    expect(isWorkLogOwner).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid data", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(mockWorkLog);
    vi.mocked(isWorkLogOwner).mockResolvedValue(true);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: 25 }), // Invalid: exceeds 24 hours
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
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "PUT",
        body: JSON.stringify({ hours: 7.5 }),
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

describe("DELETE /api/work-logs/[id]", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  const validProjectId = "550e8400-e29b-41d4-a716-446655440001";
  const validCategoryId = "550e8400-e29b-41d4-a716-446655440002";

  const mockWorkLog = {
    id: validUuid,
    userId: "user-id",
    date: new Date("2024-10-05"),
    hours: "8.0",
    projectId: validProjectId,
    categoryId: validCategoryId,
    details: "Daily work",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    project: {
      id: validProjectId,
      name: "Test Project",
      description: null,
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    category: {
      id: validCategoryId,
      name: "Development",
      description: null,
      displayOrder: 0,
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    user: {
      id: "user-id",
      name: "Test User",
      email: "user@example.com",
      role: "user" as const,
      emailVerified: null,
      image: null,
      passwordHash: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
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

  it("should return 400 for invalid UUID format", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const invalidId = "invalid-uuid";
    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${invalidId}`,
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

  it("should return 404 when work log not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
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

  it("should return 403 when non-admin user tries to delete others work log", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "other-user-id",
        email: "other@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(mockWorkLog);
    vi.mocked(isWorkLogOwner).mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
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

  it("should allow user to delete their own work log", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        email: "user@example.com",
        role: "user",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(mockWorkLog);
    vi.mocked(isWorkLogOwner).mockResolvedValue(true);
    vi.mocked(deleteWorkLog).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(deleteWorkLog).toHaveBeenCalledWith(validUuid);
  });

  it("should allow admin to delete any work log", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any);
    vi.mocked(getWorkLogById).mockResolvedValue(mockWorkLog);
    vi.mocked(deleteWorkLog).mockResolvedValue(undefined);

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
      {
        method: "DELETE",
      },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: validUuid }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(deleteWorkLog).toHaveBeenCalledWith(validUuid);
    // Admin should not need ownership check
    expect(isWorkLogOwner).not.toHaveBeenCalled();
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
    vi.mocked(getWorkLogById).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      `http://localhost:3000/api/work-logs/${validUuid}`,
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
