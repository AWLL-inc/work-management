import type { WorkCategory } from "@/drizzle/schema";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CreateWorkCategoryData {
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateWorkCategoryData {
  name?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export async function getWorkCategories(
  activeOnly = false
): Promise<WorkCategory[]> {
  const url = `/api/work-categories${activeOnly ? "?active=true" : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch work categories");
  }

  const result: ApiResponse<WorkCategory[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to fetch work categories");
  }

  return result.data;
}

export async function createWorkCategory(
  data: CreateWorkCategoryData
): Promise<WorkCategory> {
  const response = await fetch("/api/work-categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to create work category");
  }

  const result: ApiResponse<WorkCategory> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to create work category");
  }

  return result.data;
}

export async function updateWorkCategory(
  id: string,
  data: UpdateWorkCategoryData
): Promise<WorkCategory> {
  const response = await fetch(`/api/work-categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to update work category");
  }

  const result: ApiResponse<WorkCategory> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to update work category");
  }

  return result.data;
}

export async function deleteWorkCategory(id: string): Promise<void> {
  const response = await fetch(`/api/work-categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to delete work category");
  }

  const result: ApiResponse<never> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to delete work category");
  }
}
