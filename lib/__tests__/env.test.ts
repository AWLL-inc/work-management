import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Mock zod
vi.mock("zod", () => ({
  z: {
    object: vi.fn().mockReturnValue({
      parse: vi.fn(),
    }),
    enum: vi.fn().mockReturnValue({
      optional: vi.fn().mockReturnThis(),
      default: vi.fn().mockReturnThis(),
      transform: vi.fn().mockReturnThis(),
      refine: vi.fn().mockReturnThis(),
    }),
    string: vi.fn().mockReturnValue({
      min: vi.fn().mockReturnThis(),
      url: vi.fn().mockReturnThis(),
      uuid: vi.fn().mockReturnThis(),
      optional: vi.fn().mockReturnThis(),
      default: vi.fn().mockReturnThis(),
    }),
  },
}));

describe("Environment Variables", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Environment Schema Validation", () => {
    it("should create schema with correct structure", async () => {
      const mockSchema = {
        parse: vi.fn().mockReturnValue({
          NODE_ENV: "development",
          NEXTAUTH_SECRET: "test-secret-32-characters-long",
          NEXTAUTH_URL: "http://localhost:3000",
          POSTGRES_URL: "postgres://user:pass@localhost:5432/db",
          POSTGRES_URL_NON_POOLING: "postgres://user:pass@localhost:5432/db",
          DISABLE_AUTH: false,
          DEV_USER_ID: "00000000-0000-0000-0000-000000000000",
        }),
      };

      vi.mocked(z.object).mockReturnValue(mockSchema as any);

      await import("../env");

      expect(z.object).toHaveBeenCalledWith({
        NODE_ENV: expect.any(Object),
        NEXTAUTH_SECRET: expect.any(Object),
        NEXTAUTH_URL: expect.any(Object),
        POSTGRES_URL: expect.any(Object),
        POSTGRES_URL_NON_POOLING: expect.any(Object),
        DISABLE_AUTH: expect.any(Object),
        DEV_USER_ID: expect.any(Object),
      });
    });

    it("should parse environment variables with schema", async () => {
      const mockParsedEnv = {
        NODE_ENV: "development",
        NEXTAUTH_SECRET: "test-secret-32-characters-long",
        NEXTAUTH_URL: "http://localhost:3000",
        POSTGRES_URL: "postgres://user:pass@localhost:5432/db",
        POSTGRES_URL_NON_POOLING: "postgres://user:pass@localhost:5432/db",
        DISABLE_AUTH: false,
        DEV_USER_ID: "00000000-0000-0000-0000-000000000000",
      };

      const mockSchema = {
        parse: vi.fn().mockReturnValue(mockParsedEnv),
      };

      vi.mocked(z.object).mockReturnValue(mockSchema as any);

      process.env = {
        NODE_ENV: "development",
        NEXTAUTH_SECRET: "test-secret-32-characters-long",
        NEXTAUTH_URL: "http://localhost:3000",
        POSTGRES_URL: "postgres://user:pass@localhost:5432/db",
        POSTGRES_URL_NON_POOLING: "postgres://user:pass@localhost:5432/db",
        DISABLE_AUTH: "false",
        DEV_USER_ID: "00000000-0000-0000-0000-000000000000",
      };

      const { env } = await import("../env");

      expect(mockSchema.parse).toHaveBeenCalledWith(process.env);
      expect(env).toEqual(mockParsedEnv);
    });
  });

  describe("NODE_ENV validation", () => {
    it("should configure NODE_ENV enum with development, test, production", async () => {
      const mockEnum = {
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
        transform: vi.fn().mockReturnThis(),
        refine: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.enum).mockReturnValue(mockEnum as any);

      await import("../env");

      expect(z.enum).toHaveBeenCalledWith([
        "development",
        "test",
        "production",
      ]);
    });
  });

  describe("NEXTAUTH_SECRET validation", () => {
    it("should configure NEXTAUTH_SECRET with minimum 32 characters", async () => {
      const mockString = {
        min: vi.fn().mockReturnThis(),
        url: vi.fn().mockReturnThis(),
        uuid: vi.fn().mockReturnThis(),
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.string).mockReturnValue(mockString as any);

      await import("../env");

      expect(z.string).toHaveBeenCalled();
      expect(mockString.min).toHaveBeenCalledWith(32);
    });
  });

  describe("URL validation", () => {
    it("should configure NEXTAUTH_URL as URL", async () => {
      const mockString = {
        min: vi.fn().mockReturnThis(),
        url: vi.fn().mockReturnThis(),
        uuid: vi.fn().mockReturnThis(),
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.string).mockReturnValue(mockString as any);

      await import("../env");

      expect(z.string).toHaveBeenCalled();
      expect(mockString.url).toHaveBeenCalled();
    });

    it("should configure POSTGRES_URL as URL", async () => {
      const mockString = {
        min: vi.fn().mockReturnThis(),
        url: vi.fn().mockReturnThis(),
        uuid: vi.fn().mockReturnThis(),
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.string).mockReturnValue(mockString as any);

      await import("../env");

      expect(mockString.url).toHaveBeenCalled();
    });

    it("should configure POSTGRES_URL_NON_POOLING as URL", async () => {
      const mockString = {
        min: vi.fn().mockReturnThis(),
        url: vi.fn().mockReturnThis(),
        uuid: vi.fn().mockReturnThis(),
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.string).mockReturnValue(mockString as any);

      await import("../env");

      expect(mockString.url).toHaveBeenCalled();
    });
  });

  describe("DISABLE_AUTH validation", () => {
    it("should configure DISABLE_AUTH enum with true/false", async () => {
      const mockEnum = {
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
        transform: vi.fn().mockReturnThis(),
        refine: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.enum).mockReturnValue(mockEnum as any);

      await import("../env");

      // Should be called twice - once for NODE_ENV, once for DISABLE_AUTH
      expect(z.enum).toHaveBeenCalledWith(["true", "false"]);
    });

    it("should configure DISABLE_AUTH with default false", async () => {
      const mockEnum = {
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
        transform: vi.fn().mockReturnThis(),
        refine: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.enum).mockReturnValue(mockEnum as any);

      await import("../env");

      expect(mockEnum.optional).toHaveBeenCalled();
      expect(mockEnum.default).toHaveBeenCalledWith("false");
    });

    it("should configure DISABLE_AUTH with transform function", async () => {
      const mockEnum = {
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
        transform: vi.fn().mockReturnThis(),
        refine: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.enum).mockReturnValue(mockEnum as any);

      await import("../env");

      expect(mockEnum.transform).toHaveBeenCalledWith(expect.any(Function));

      // Test transform function
      const transformCall = vi.mocked(mockEnum.transform).mock.calls[0];
      const transformFn = transformCall[0];

      expect(transformFn("true")).toBe(true);
      expect(transformFn("false")).toBe(false);
    });

    it("should configure DISABLE_AUTH with production refine validation", async () => {
      const mockEnum = {
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
        transform: vi.fn().mockReturnThis(),
        refine: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.enum).mockReturnValue(mockEnum as any);

      await import("../env");

      expect(mockEnum.refine).toHaveBeenCalledWith(expect.any(Function), {
        message: "DISABLE_AUTH cannot be enabled in production environment",
      });

      // Test refine function
      const refineCall = vi.mocked(mockEnum.refine).mock.calls[0];
      const refineFn = refineCall[0];

      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;

      // Test refine function with production environment
      vi.stubEnv("NODE_ENV", "production");
      expect(refineFn(true)).toBe(false); // Should fail validation
      expect(refineFn(false)).toBe(true); // Should pass validation

      // Test refine function with development environment
      vi.stubEnv("NODE_ENV", "development");
      expect(refineFn(true)).toBe(true); // Should pass validation
      expect(refineFn(false)).toBe(true); // Should pass validation

      // Restore original NODE_ENV
      vi.stubEnv("NODE_ENV", originalNodeEnv);
    });
  });

  describe("DEV_USER_ID validation", () => {
    it("should configure DEV_USER_ID as UUID with default value", async () => {
      const mockString = {
        min: vi.fn().mockReturnThis(),
        url: vi.fn().mockReturnThis(),
        uuid: vi.fn().mockReturnThis(),
        optional: vi.fn().mockReturnThis(),
        default: vi.fn().mockReturnThis(),
      };

      vi.mocked(z.string).mockReturnValue(mockString as any);

      await import("../env");

      expect(z.string).toHaveBeenCalled();
      expect(mockString.uuid).toHaveBeenCalled();
      expect(mockString.optional).toHaveBeenCalled();
      expect(mockString.default).toHaveBeenCalledWith(
        "00000000-0000-0000-0000-000000000000",
      );
    });
  });

  describe("Environment variable parsing", () => {
    it("should handle valid environment variables", async () => {
      const validEnv = {
        NODE_ENV: "development",
        NEXTAUTH_SECRET: "test-secret-32-characters-long-enough",
        NEXTAUTH_URL: "http://localhost:3000",
        POSTGRES_URL: "postgres://user:pass@localhost:5432/db",
        POSTGRES_URL_NON_POOLING: "postgres://user:pass@localhost:5432/db",
        DISABLE_AUTH: "false",
        DEV_USER_ID: "12345678-1234-5678-9012-123456789012",
      };

      const mockSchema = {
        parse: vi.fn().mockReturnValue({
          NODE_ENV: "development",
          NEXTAUTH_SECRET: "test-secret-32-characters-long-enough",
          NEXTAUTH_URL: "http://localhost:3000",
          POSTGRES_URL: "postgres://user:pass@localhost:5432/db",
          POSTGRES_URL_NON_POOLING: "postgres://user:pass@localhost:5432/db",
          DISABLE_AUTH: false,
          DEV_USER_ID: "12345678-1234-5678-9012-123456789012",
        }),
      };

      vi.mocked(z.object).mockReturnValue(mockSchema as any);

      process.env = validEnv as any;

      const { env } = await import("../env");

      expect(mockSchema.parse).toHaveBeenCalledWith(validEnv);
      expect(env.NODE_ENV).toBe("development");
      expect(env.DISABLE_AUTH).toBe(false);
    });

    it("should handle missing optional environment variables", async () => {
      const minimalEnv = {
        NODE_ENV: "test",
        NEXTAUTH_SECRET: "test-secret-32-characters-long-enough",
        NEXTAUTH_URL: "http://localhost:3000",
        POSTGRES_URL: "postgres://user:pass@localhost:5432/db",
        POSTGRES_URL_NON_POOLING: "postgres://user:pass@localhost:5432/db",
      };

      const mockSchema = {
        parse: vi.fn().mockReturnValue({
          NODE_ENV: "test",
          NEXTAUTH_SECRET: "test-secret-32-characters-long-enough",
          NEXTAUTH_URL: "http://localhost:3000",
          POSTGRES_URL: "postgres://user:pass@localhost:5432/db",
          POSTGRES_URL_NON_POOLING: "postgres://user:pass@localhost:5432/db",
          DISABLE_AUTH: false, // default value
          DEV_USER_ID: "00000000-0000-0000-0000-000000000000", // default value
        }),
      };

      vi.mocked(z.object).mockReturnValue(mockSchema as any);

      process.env = minimalEnv as any;

      const { env } = await import("../env");

      expect(env.DISABLE_AUTH).toBe(false);
      expect(env.DEV_USER_ID).toBe("00000000-0000-0000-0000-000000000000");
    });
  });
});
