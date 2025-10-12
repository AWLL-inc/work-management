/**
 * Common API utility functions
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Handle API response with standardized error handling
 * @param response - Fetch response object
 * @param errorMessage - Default error message if parsing fails
 * @returns Parsed data from successful response
 * @throws Error with appropriate message for failed responses
 */
export async function handleApiResponse<T>(
  response: Response,
  errorMessage: string,
): Promise<T> {
  if (!response.ok) {
    let message = errorMessage;
    try {
      const result: ApiResponse<never> = await response.json();
      message = result.error?.message || message;
      if (process.env.NODE_ENV === "development") {
        console.error("API Error:", result.error);
      }
    } catch (parseError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to parse error response:", parseError);
      }
      message = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(message);
  }

  const result: ApiResponse<T> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || errorMessage);
  }

  return result.data;
}

/**
 * Handle API response without expecting data (for DELETE operations)
 * @param response - Fetch response object
 * @param errorMessage - Default error message if parsing fails
 * @throws Error with appropriate message for failed responses
 */
export async function handleApiResponseNoData(
  response: Response,
  errorMessage: string,
): Promise<void> {
  if (!response.ok) {
    let message = errorMessage;
    try {
      const result: ApiResponse<never> = await response.json();
      message = result.error?.message || message;
      if (process.env.NODE_ENV === "development") {
        console.error("API Error:", result.error);
      }
    } catch (parseError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to parse error response:", parseError);
      }
      message = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(message);
  }

  const result: ApiResponse<never> = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || errorMessage);
  }
}
