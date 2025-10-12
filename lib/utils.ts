import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and sanitizes a callback URL to prevent open redirect attacks
 * @param url The callback URL to validate
 * @returns A safe callback URL (relative path) or default fallback
 */
export function validateCallbackUrl(url: string): string {
  try {
    // 相対パスの場合はそのまま返す（二重スラッシュは除外）
    if (url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }

    // プロトコルが含まれていない場合（絶対URLでない場合）は無効とする
    if (!url.includes("://")) {
      return "/";
    }

    // 絶対URLの場合、同一オリジンのみ許可
    const callbackUrl = new URL(url);
    const appUrl = new URL(process.env.NEXTAUTH_URL || "");

    if (callbackUrl.origin === appUrl.origin) {
      return callbackUrl.pathname + callbackUrl.search;
    }

    // 外部URLの場合はデフォルトにフォールバック
    return "/";
  } catch {
    // 不正なURLの場合はデフォルトにフォールバック
    return "/";
  }
}

/**
 * Format date value for display in YYYY/MM/DD format
 * @param value - Date string, Date object, or null/undefined value
 * @returns Formatted date string in YYYY/MM/DD format or original value as string
 */
export function formatDateForDisplay(
  value: string | Date | null | undefined,
): string {
  if (!value) return "";

  try {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  } catch {
    return String(value);
  }
}

/**
 * Parse date string and return Date object or null
 * @param value - Date string in YYYY-MM-DD format
 * @returns Date object if valid, null otherwise
 */
export function parseDate(value: string): Date | null {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(value)) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
