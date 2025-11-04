export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Sanitized user type (without password hash)
 */
export interface SanitizedUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
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

export async function getUsers(): Promise<SanitizedUser[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/users`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const result: ApiResponse<SanitizedUser[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to fetch users");
  }

  return result.data;
}
