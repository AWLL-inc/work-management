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

    // 絶対URLの場合、同一オリジンのみ許可
    const callbackUrl = new URL(url, process.env.NEXTAUTH_URL);
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
