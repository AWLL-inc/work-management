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

export interface GetWorkLogsOptions {
  startDate?: string;
  endDate?: string;
  projectIds?: string;
  categoryIds?: string;
  userId?: string;
  page?: number;
  limit?: number;
  searchText?: string;
}

export async function getWorkLogs(
  options?: GetWorkLogsOptions,
): Promise<WorkLog[]> {
  let url = "/api/work-logs";

  if (options) {
    const params = new URLSearchParams();

    if (options.startDate) params.set("startDate", options.startDate);
    if (options.endDate) params.set("endDate", options.endDate);
    if (options.projectIds) params.set("projectIds", options.projectIds);
    if (options.categoryIds) params.set("categoryIds", options.categoryIds);
    if (options.userId) params.set("userId", options.userId);
    if (options.page) params.set("page", options.page.toString());
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.searchText) params.set("searchText", options.searchText);

    const paramString = params.toString();
    if (paramString) {
      url += `?${paramString}`;
    }
  }

  const response = await fetch(url);
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
