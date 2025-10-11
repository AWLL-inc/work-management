import type { WorkLog } from "@/drizzle/schema";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CreateWorkLogData {
  date: string | Date;
  hours: string;
  projectId: string;
  categoryId: string;
  details?: string | null;
}

export interface UpdateWorkLogData {
  date?: string | Date;
  hours?: string;
  projectId?: string;
  categoryId?: string;
  details?: string | null;
}

export async function getWorkLogs(): Promise<WorkLog[]> {
  const response = await fetch("/api/work-logs");

  if (!response.ok) {
    throw new Error("Failed to fetch work logs");
  }

  const result: ApiResponse<WorkLog[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to fetch work logs");
  }

  return result.data;
}

export async function createWorkLog(data: CreateWorkLogData): Promise<WorkLog> {
  const response = await fetch("/api/work-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to create work log");
  }

  const result: ApiResponse<WorkLog> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to create work log");
  }

  return result.data;
}

export async function updateWorkLog(
  id: string,
  data: UpdateWorkLogData,
): Promise<WorkLog> {
  const response = await fetch(`/api/work-logs/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to update work log");
  }

  const result: ApiResponse<WorkLog> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to update work log");
  }

  return result.data;
}

export async function deleteWorkLog(id: string): Promise<void> {
  const response = await fetch(`/api/work-logs/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to delete work log");
  }

  const result: ApiResponse<never> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to delete work log");
  }
}
