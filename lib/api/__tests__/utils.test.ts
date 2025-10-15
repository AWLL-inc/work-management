import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ApiError,
  handleApiResponse,
  handleApiResponseNoData,
  type ApiResponse,
} from "../utils";

describe("lib/api/utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error in development mode
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ApiError", () => {
    it("should create ApiError with all properties", () => {
      const error = new ApiError("Test message", "TEST_CODE", 400, { field: "value" });

      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: "value" });
      expect(error.name).toBe("ApiError");
      expect(error).toBeInstanceOf(Error);
    });

    it("should create ApiError without details", () => {
      const error = new ApiError("Test message", "TEST_CODE", 500);

      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.status).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe("handleApiResponse", () => {
    it("should return data for successful response", async () => {
      const mockData = { id: "1", name: "Test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      } as unknown as Response;

      const result = await handleApiResponse(mockResponse, "Error message");

      expect(result).toEqual(mockData);
      expect(mockResponse.json).toHaveBeenCalledOnce();
    });

    it("should throw ApiError when response is not ok with error details", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: { field: "name" },
          },
        }),
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponse(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Invalid input");
          expect(error.code).toBe("VALIDATION_ERROR");
          expect(error.status).toBe(400);
          expect(error.details).toEqual({ field: "name" });
        }
      }
    });

    it("should throw ApiError when response is not ok with default error", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponse(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Default error");
          expect(error.code).toBe("UNKNOWN_ERROR");
          expect(error.status).toBe(500);
        }
      }
    });

    it("should throw ApiError when response is not ok and JSON parse fails", async () => {
      const mockResponse = {
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: vi.fn().mockRejectedValue(new Error("Parse error")),
      } as unknown as Response;

      // Mock NODE_ENV to development for console.error coverage
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      await expect(handleApiResponse(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponse(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("HTTP 502: Bad Gateway");
          expect(error.code).toBe("HTTP_ERROR");
          expect(error.status).toBe(502);
        }
      }

      process.env.NODE_ENV = originalEnv;
    });

    it("should throw ApiError when response success is false", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "BUSINESS_ERROR",
            message: "Business logic error",
          },
        }),
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponse(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Business logic error");
          expect(error.code).toBe("BUSINESS_ERROR");
          expect(error.status).toBe(200);
        }
      }
    });

    it("should throw ApiError when data is missing", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponse(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Default error");
          expect(error.code).toBe("UNKNOWN_ERROR");
          expect(error.status).toBe(200);
        }
      }
    });

    it("should log error in development mode", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "TEST_ERROR",
            message: "Test error message",
          },
        }),
      } as unknown as Response;

      try {
        await handleApiResponse(mockResponse, "Default error");
      } catch (error) {
        // Error should be logged
      }

      expect(console.error).toHaveBeenCalledWith("API Error:", {
        code: "TEST_ERROR",
        message: "Test error message",
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("handleApiResponseNoData", () => {
    it("should complete successfully for 204 No Content response", async () => {
      const mockResponse = {
        ok: true,
        status: 204,
      } as unknown as Response;

      await expect(handleApiResponseNoData(mockResponse, "Error message")).resolves.toBeUndefined();
    });

    it("should complete successfully for successful response with success true", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
        }),
      } as unknown as Response;

      await expect(handleApiResponseNoData(mockResponse, "Error message")).resolves.toBeUndefined();
      expect(mockResponse.json).toHaveBeenCalledOnce();
    });

    it("should throw ApiError when response is not ok", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Resource not found",
          },
        }),
      } as unknown as Response;

      await expect(handleApiResponseNoData(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponseNoData(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Resource not found");
          expect(error.code).toBe("NOT_FOUND");
          expect(error.status).toBe(404);
        }
      }
    });

    it("should throw ApiError when response success is false", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "DELETE_ERROR",
            message: "Cannot delete resource",
          },
        }),
      } as unknown as Response;

      await expect(handleApiResponseNoData(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponseNoData(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Cannot delete resource");
          expect(error.code).toBe("DELETE_ERROR");
          expect(error.status).toBe(200);
        }
      }
    });

    it("should throw ApiError when response success is false without error message", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      } as unknown as Response;

      await expect(handleApiResponseNoData(mockResponse, "Default error")).rejects.toThrow(
        ApiError
      );

      try {
        await handleApiResponseNoData(mockResponse, "Default error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Default error");
          expect(error.code).toBe("UNKNOWN_ERROR");
          expect(error.status).toBe(200);
        }
      }
    });

    it("should log error in development mode when JSON parse fails", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn().mockRejectedValue(new Error("Parse error")),
      } as unknown as Response;

      try {
        await handleApiResponseNoData(mockResponse, "Default error");
      } catch (error) {
        // Error should be logged
      }

      expect(console.error).toHaveBeenCalledWith("Failed to parse error response:", expect.any(Error));

      process.env.NODE_ENV = originalEnv;
    });
  });
});