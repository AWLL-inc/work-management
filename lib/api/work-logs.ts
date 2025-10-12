import type { WorkLog } from "@/drizzle/schema";
import { handleApiResponse, handleApiResponseNoData } from "./utils";

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
  return handleApiResponse<WorkLog[]>(response, "Failed to fetch work logs");
}

export async function createWorkLog(data: CreateWorkLogData): Promise<WorkLog> {
  const response = await fetch("/api/work-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleApiResponse<WorkLog>(response, "Failed to create work log");
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

  return handleApiResponse<WorkLog>(response, "Failed to update work log");
}

export async function deleteWorkLog(id: string): Promise<void> {
  const response = await fetch(`/api/work-logs/${id}`, {
    method: "DELETE",
  });

  return handleApiResponseNoData(response, "Failed to delete work log");
}
