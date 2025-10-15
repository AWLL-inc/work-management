import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock @vercel/postgres
const mockVercelSql = {};
vi.mock("@vercel/postgres", () => ({
  sql: mockVercelSql,
}));

// Mock drizzle postgres drivers
const mockDrizzleVercel = vi.fn();
const mockDrizzlePostgres = vi.fn();
vi.mock("drizzle-orm/vercel-postgres", () => ({
  drizzle: mockDrizzleVercel,
}));
vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: mockDrizzlePostgres,
}));

// Mock postgres client
const mockPostgres = vi.fn();
vi.mock("postgres", () => ({
  default: mockPostgres,
}));

// Mock schema
vi.mock("@/drizzle/schema", () => ({
  __esModule: true,
  default: {},
}));

describe("Database Connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Clear environment variables
    delete process.env.VERCEL;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
  });

  describe("Vercel Environment", () => {
    it("should use Vercel Postgres when VERCEL env is set", async () => {
      process.env.VERCEL = "1";
      mockDrizzleVercel.mockReturnValue("vercel-db-instance");

      // Import after setting env vars
      await import("../connection");

      expect(mockDrizzleVercel).toHaveBeenCalledWith(mockVercelSql, {
        schema: expect.any(Object),
      });
      expect(mockDrizzlePostgres).not.toHaveBeenCalled();
      expect(mockPostgres).not.toHaveBeenCalled();
    });

    it("should use Vercel Postgres when POSTGRES_URL contains vercel-storage", async () => {
      process.env.POSTGRES_URL = "postgres://user:pass@host.vercel-storage.com/db";
      mockDrizzleVercel.mockReturnValue("vercel-db-instance");

      // Import after setting env vars
      await import("../connection");

      expect(mockDrizzleVercel).toHaveBeenCalledWith(mockVercelSql, {
        schema: expect.any(Object),
      });
      expect(mockDrizzlePostgres).not.toHaveBeenCalled();
      expect(mockPostgres).not.toHaveBeenCalled();
    });
  });

  describe("Local Environment", () => {
    it("should use postgres driver with POSTGRES_URL", async () => {
      const connectionString = "postgres://user:pass@localhost:5432/testdb";
      process.env.POSTGRES_URL = connectionString;

      const mockQueryClient = {};
      mockPostgres.mockReturnValue(mockQueryClient);
      mockDrizzlePostgres.mockReturnValue("postgres-db-instance");

      // Import after setting env vars
      await import("../connection");

      expect(mockPostgres).toHaveBeenCalledWith(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      expect(mockDrizzlePostgres).toHaveBeenCalledWith(mockQueryClient, {
        schema: expect.any(Object),
      });
      expect(mockDrizzleVercel).not.toHaveBeenCalled();
    });

    it("should use postgres driver with DATABASE_URL when POSTGRES_URL is not available", async () => {
      const connectionString = "postgres://user:pass@localhost:5432/testdb";
      process.env.DATABASE_URL = connectionString;

      const mockQueryClient = {};
      mockPostgres.mockReturnValue(mockQueryClient);
      mockDrizzlePostgres.mockReturnValue("postgres-db-instance");

      // Import after setting env vars
      await import("../connection");

      expect(mockPostgres).toHaveBeenCalledWith(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      expect(mockDrizzlePostgres).toHaveBeenCalledWith(mockQueryClient, {
        schema: expect.any(Object),
      });
      expect(mockDrizzleVercel).not.toHaveBeenCalled();
    });

    it("should throw error when no connection string is provided", async () => {
      // No POSTGRES_URL or DATABASE_URL set
      await expect(async () => {
        await import("../connection");
      }).rejects.toThrow("Database connection string not found. Please set POSTGRES_URL or DATABASE_URL environment variable.");
    });
  });

  describe("Connection Configuration", () => {
    it("should configure postgres client with correct pool settings", async () => {
      const connectionString = "postgres://user:pass@localhost:5432/testdb";
      process.env.POSTGRES_URL = connectionString;

      const mockQueryClient = {};
      mockPostgres.mockReturnValue(mockQueryClient);
      mockDrizzlePostgres.mockReturnValue("postgres-db-instance");

      await import("../connection");

      expect(mockPostgres).toHaveBeenCalledWith(connectionString, {
        max: 10, // Maximum connections in pool
        idle_timeout: 20,
        connect_timeout: 10,
      });
    });

    it("should include schema in drizzle configuration", async () => {
      process.env.VERCEL = "1";
      mockDrizzleVercel.mockReturnValue("vercel-db-instance");

      await import("../connection");

      expect(mockDrizzleVercel).toHaveBeenCalledWith(mockVercelSql, {
        schema: expect.any(Object),
      });
    });
  });

  describe("Environment Detection", () => {
    it("should detect Vercel environment when both VERCEL and vercel-storage URL are present", async () => {
      process.env.VERCEL = "1";
      process.env.POSTGRES_URL = "postgres://user:pass@host.vercel-storage.com/db";
      mockDrizzleVercel.mockReturnValue("vercel-db-instance");

      await import("../connection");

      expect(mockDrizzleVercel).toHaveBeenCalled();
      expect(mockDrizzlePostgres).not.toHaveBeenCalled();
      expect(mockPostgres).not.toHaveBeenCalled();
    });

    it("should use local postgres when neither VERCEL nor vercel-storage URL is present", async () => {
      process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/testdb";

      const mockQueryClient = {};
      mockPostgres.mockReturnValue(mockQueryClient);
      mockDrizzlePostgres.mockReturnValue("postgres-db-instance");

      await import("../connection");

      expect(mockDrizzlePostgres).toHaveBeenCalled();
      expect(mockDrizzleVercel).not.toHaveBeenCalled();
    });
  });
});