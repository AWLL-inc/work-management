/**
 * Work Log utility functions
 *
 * Common data transformation and normalization utilities for Work Logs
 */

import type { WorkLog } from "@/drizzle/schema";

/**
 * WorkLogGridRow extends WorkLog with additional display fields
 * Note: date is normalized to string format (YYYY-MM-DD) for AG Grid compatibility
 */
export interface WorkLogGridRow extends Omit<WorkLog, "date"> {
  date: string;
  projectName?: string;
  categoryName?: string;
}

/**
 * Normalize work log date to YYYY-MM-DD format
 *
 * @param date - Date in various formats (Date object, ISO string, or unknown)
 * @returns Normalized date string in YYYY-MM-DD format
 */
export function normalizeWorkLogDate(date: Date | string | unknown): string {
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  if (typeof date === "string") {
    return date.split("T")[0];
  }
  return new Date(date as string).toISOString().split("T")[0];
}

/**
 * Prepare work log data for AG Grid display
 *
 * @param workLog - Source work log data
 * @param projectsMap - Map of project IDs to names
 * @param categoriesMap - Map of category IDs to names
 * @returns Work log row data with display fields
 */
export function prepareWorkLogForGrid(
  workLog: WorkLog,
  projectsMap: Map<string, string>,
  categoriesMap: Map<string, string>,
): WorkLogGridRow {
  // Use structuredClone for better performance than JSON.parse/stringify
  const workLogCopy = structuredClone(workLog);

  return {
    ...workLogCopy,
    // Normalize date to consistent format
    date: normalizeWorkLogDate(workLogCopy.date),
    // Ensure ID fields are always strings
    projectId: workLogCopy.projectId || "",
    projectName: projectsMap.get(workLogCopy.projectId) || "Unknown",
    categoryId: workLogCopy.categoryId || "",
    categoryName: categoriesMap.get(workLogCopy.categoryId) || "Unknown",
  };
}
