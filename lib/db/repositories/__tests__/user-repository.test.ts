import { eq, ne } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { users } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";
import { getAllUsers, getUserByEmail, getUserById } from "../user-repository";

// Mock the database
vi.mock("@/lib/db/connection", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("User Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("should return all users when activeOnly is false", async () => {
      const mockUsers = [
        {
          id: "1",
          name: "User 1",
          email: "user1@example.com",
          role: "user",
          emailVerified: null,
          image: null,
          passwordHash: "hash1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "User 2",
          email: "user2@example.com",
          role: "inactive",
          emailVerified: null,
          image: null,
          passwordHash: "hash2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await getAllUsers({ activeOnly: false });

      expect(db.select).toHaveBeenCalled();
      expect(mockQuery.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      // Should NOT have called where() when activeOnly is false
      expect(mockQuery.where).not.toHaveBeenCalled();
    });

    it("should filter inactive users when activeOnly is true", async () => {
      const mockUsers = [
        {
          id: "1",
          name: "User 1",
          email: "user1@example.com",
          role: "user",
          emailVerified: null,
          image: null,
          passwordHash: "hash1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await getAllUsers({ activeOnly: true });

      expect(db.select).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();
      expect(mockQuery.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result.every((u) => u.role !== "inactive")).toBe(true);
    });

    it("should return all users by default when no options provided", async () => {
      const mockUsers = [
        {
          id: "1",
          name: "User 1",
          email: "user1@example.com",
          role: "user",
          emailVerified: null,
          image: null,
          passwordHash: "hash1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await getAllUsers();

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe("getUserById", () => {
    it("should return user when id exists", async () => {
      const mockUser = {
        id: "test-id",
        name: "Test User",
        email: "test@example.com",
        role: "user",
        emailVerified: null,
        image: null,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await getUserById("test-id");

      expect(db.select).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it("should return undefined when id does not exist", async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await getUserById("non-existent-id");

      expect(db.select).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when email exists", async () => {
      const mockUser = {
        id: "test-id",
        name: "Test User",
        email: "test@example.com",
        role: "user",
        emailVerified: null,
        image: null,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await getUserByEmail("test@example.com");

      expect(db.select).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it("should return undefined when email does not exist", async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await getUserByEmail("nonexistent@example.com");

      expect(db.select).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
