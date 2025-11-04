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

/**
 * Get the base URL for API calls
 * Needed for server-side fetching where relative URLs don't work
 */
function getBaseUrl(): string {
  // Browser environment
  if (typeof window !== "undefined") {
    return "";
  }

  // Server environment
  // Use NEXT_PUBLIC_APP_URL if available, otherwise construct from host
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Default to localhost for development
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

export async function getProjects(activeOnly = false): Promise<Project[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/projects${activeOnly ? "?active=true" : ""}`;
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
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/projects`, {
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
  data: UpdateProjectData,
): Promise<Project> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/projects/${id}`, {
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
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/projects/${id}`, {
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
