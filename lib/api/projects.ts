import type { Project } from "@/drizzle/schema";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CreateProjectData {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export async function getProjects(activeOnly = false): Promise<Project[]> {
  const url = `/api/projects${activeOnly ? "?active=true" : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  const result: ApiResponse<Project[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to fetch projects");
  }

  return result.data;
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to create project");
  }

  const result: ApiResponse<Project> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to create project");
  }

  return result.data;
}

export async function updateProject(
  id: string,
  data: UpdateProjectData
): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to update project");
  }

  const result: ApiResponse<Project> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to update project");
  }

  return result.data;
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to delete project");
  }

  const result: ApiResponse<never> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to delete project");
  }
}
