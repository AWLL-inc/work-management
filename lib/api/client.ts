/**
 * Unified API Client for consistent error handling and response processing
 * Following 2025 best practices for Next.js 15 + TypeScript
 */

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
 * Custom API error with HTTP status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Unified API Client with consistent error handling
 */
export class ApiClient {
  /**
   * Handle API response and extract data or throw error
   */
  private async handleResponse<T>(
    response: Response,
    options?: { allowNoContent?: boolean },
  ): Promise<T | undefined> {
    // Handle 204 No Content responses (typically for DELETE operations)
    if (options?.allowNoContent && response.status === 204) {
      return;
    }

    // Handle error responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorCode = `HTTP_${response.status}`;
      let errorDetails: unknown;

      try {
        const result: ApiResponse<never> = await response.json();
        if (result.error) {
          errorMessage = result.error.message;
          errorCode = result.error.code;
          errorDetails = result.error.details;
        }
      } catch {
        // If JSON parsing fails, use default error message
      }

      throw new ApiError(
        errorMessage,
        response.status,
        errorCode,
        errorDetails,
      );
    }

    // Handle successful responses with JSON body
    const result: ApiResponse<T> = await response.json();

    if (!result.success || !result.data) {
      throw new ApiError(
        result.error?.message || "Request succeeded but returned no data",
        response.status,
        result.error?.code,
        result.error?.details,
      );
    }

    return result.data;
  }

  /**
   * HTTP GET request
   */
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return this.handleResponse<T>(response) as Promise<T>;
  }

  /**
   * HTTP POST request
   */
  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response) as Promise<T>;
  }

  /**
   * HTTP PUT request
   */
  async put<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response) as Promise<T>;
  }

  /**
   * HTTP DELETE request (supports 204 No Content)
   */
  async delete(url: string): Promise<void> {
    const response = await fetch(url, { method: "DELETE" });
    return this.handleResponse(response, {
      allowNoContent: true,
    }) as Promise<void>;
  }
}

/**
 * Singleton instance for application-wide use
 */
export const apiClient = new ApiClient();
