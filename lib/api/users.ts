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

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    // Wait with exponential backoff
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry with increased delay
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export async function getUsers(): Promise<SanitizedUser[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/users`;

  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(url, {}, 10000);

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const result: ApiResponse<SanitizedUser[]> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || "Failed to fetch users");
    }

    return result.data;
  });
}
