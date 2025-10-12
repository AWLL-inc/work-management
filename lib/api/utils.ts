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
 * Custom API Error class with enhanced error information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Extract error message from failed API response
 * @param response - Failed fetch response object
 * @param defaultMessage - Default error message to use as fallback
 * @returns Promise resolving to ApiError with extracted information
 */
async function extractErrorFromResponse(
  response: Response,
  defaultMessage: string,
): Promise<ApiError> {
  try {
    const result: ApiResponse<never> = await response.json();
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", result.error);
    }
    return new ApiError(
      result.error?.message || defaultMessage,
      result.error?.code || "UNKNOWN_ERROR",
      response.status,
      result.error?.details,
    );
  } catch (parseError) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to parse error response:", parseError);
    }
    return new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      "HTTP_ERROR",
      response.status,
    );
  }
}

/**
 * Handle API response with standardized error handling
 * @param response - Fetch response object
 * @param errorMessage - Default error message if parsing fails
 * @returns Parsed data from successful response
 * @throws ApiError with enhanced error information for failed responses
 */
export async function handleApiResponse<T>(
  response: Response,
  errorMessage: string,
): Promise<T> {
  if (!response.ok) {
    throw await extractErrorFromResponse(response, errorMessage);
  }

  const result: ApiResponse<T> = await response.json();
  if (!result.success || !result.data) {
    throw new ApiError(
      result.error?.message || errorMessage,
      result.error?.code || "UNKNOWN_ERROR",
      response.status,
      result.error?.details,
    );
  }

  return result.data;
}

/**
 * Handle API response without expecting data (for DELETE operations)
 * @param response - Fetch response object
 * @param errorMessage - Default error message if parsing fails
 * @throws ApiError with enhanced error information for failed responses
 */
export async function handleApiResponseNoData(
  response: Response,
  errorMessage: string,
): Promise<void> {
  if (!response.ok) {
    throw await extractErrorFromResponse(response, errorMessage);
  }

  const result: ApiResponse<never> = await response.json();
  if (!result.success) {
    throw new ApiError(
      result.error?.message || errorMessage,
      result.error?.code || "UNKNOWN_ERROR",
      response.status,
      result.error?.details,
    );
  }
}
