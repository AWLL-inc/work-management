/**
 * CSV Export Utility
 * Provides functions to export data to CSV format
 */

import type { WorkLog } from "@/drizzle/schema";

/**
 * Escapes CSV special characters and wraps value in quotes if needed
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a date for CSV export
 */
function formatDateForCsv(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  if (typeof date === "string") {
    return date.split("T")[0];
  }
  return String(date);
}

export interface WorkLogCsvRow {
  date: Date | string;
  user: string;
  hours: string;
  project: string;
  category: string;
  details: string | null;
}

/**
 * Exports work logs to CSV format and triggers download
 */
export function exportWorkLogsToCsv(
  workLogs: WorkLogCsvRow[],
  filename?: string,
): void {
  // CSV header
  const headers = ["日付", "ユーザー", "工数", "プロジェクト", "カテゴリ", "詳細"];
  const csvRows = [headers.join(",")];

  // Add data rows
  for (const log of workLogs) {
    const row = [
      escapeCsvValue(formatDateForCsv(log.date)),
      escapeCsvValue(log.user),
      escapeCsvValue(log.hours),
      escapeCsvValue(log.project),
      escapeCsvValue(log.category),
      escapeCsvValue(log.details),
    ];
    csvRows.push(row.join(","));
  }

  // Create CSV content with BOM for proper Excel encoding
  const BOM = "\uFEFF";
  const csvContent = BOM + csvRows.join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `work-logs-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
