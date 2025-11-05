import { describe, expect, it } from "vitest";
import {
  isValidDateString,
  isValidUUID,
  parseUrlDate,
  parseUrlUUID,
  parseUrlUUIDs,
} from "../url-validation";

describe("url-validation", () => {
  describe("isValidUUID", () => {
    it("should validate correct UUID v4", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUUID("6ba7b810-9dad-41d1-80b4-00c04fd430c8")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(isValidUUID("invalid-uuid")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false); // Too short
      expect(isValidUUID("")).toBe(false);
      expect(isValidUUID("550e8400-e29b-31d4-a716-446655440000")).toBe(false); // Wrong version (3, not 4)
    });

    it("should handle case-insensitive validation", () => {
      expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
      expect(isValidUUID("550e8400-E29B-41d4-a716-446655440000")).toBe(true);
    });
  });

  describe("parseUrlUUID", () => {
    it("should parse valid UUID", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(parseUrlUUID(uuid)).toBe(uuid);
    });

    it("should return undefined for invalid input", () => {
      expect(parseUrlUUID("invalid")).toBeUndefined();
      expect(parseUrlUUID("")).toBeUndefined();
      expect(parseUrlUUID(null)).toBeUndefined();
      expect(parseUrlUUID(undefined)).toBeUndefined();
      expect(parseUrlUUID("  ")).toBeUndefined(); // Whitespace only
    });

    it("should handle trimmed whitespace", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(parseUrlUUID(` ${uuid} `)).toBe(uuid);
    });

    it("should reject UUID with invalid format", () => {
      expect(parseUrlUUID("550e8400-e29b-41d4-a716")).toBeUndefined();
      expect(parseUrlUUID("not-a-uuid-at-all")).toBeUndefined();
    });
  });

  describe("parseUrlUUIDs", () => {
    it("should parse comma-separated UUIDs", () => {
      const result = parseUrlUUIDs(
        "550e8400-e29b-41d4-a716-446655440000,650e8400-e29b-41d4-a716-446655440000",
      );
      expect(result).toHaveLength(2);
      expect(result?.[0]).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result?.[1]).toBe("650e8400-e29b-41d4-a716-446655440000");
    });

    it("should filter out invalid UUIDs", () => {
      const result = parseUrlUUIDs(
        "550e8400-e29b-41d4-a716-446655440000,invalid,650e8400-e29b-41d4-a716-446655440000",
      );
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        "550e8400-e29b-41d4-a716-446655440000",
        "650e8400-e29b-41d4-a716-446655440000",
      ]);
    });

    it("should handle edge cases", () => {
      expect(parseUrlUUIDs("")).toBeUndefined();
      expect(parseUrlUUIDs(",,,")).toBeUndefined();
      expect(parseUrlUUIDs(" , , ")).toBeUndefined();
      expect(parseUrlUUIDs(null)).toBeUndefined();
      expect(parseUrlUUIDs(undefined)).toBeUndefined();
    });

    it("should trim whitespace from UUIDs", () => {
      const result = parseUrlUUIDs(
        " 550e8400-e29b-41d4-a716-446655440000 , 650e8400-e29b-41d4-a716-446655440000 ",
      );
      expect(result).toHaveLength(2);
      expect(result?.[0]).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result?.[1]).toBe("650e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle single UUID", () => {
      const result = parseUrlUUIDs("550e8400-e29b-41d4-a716-446655440000");
      expect(result).toHaveLength(1);
      expect(result?.[0]).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should return undefined when all UUIDs are invalid", () => {
      expect(parseUrlUUIDs("invalid1,invalid2,invalid3")).toBeUndefined();
    });
  });

  describe("parseUrlDate", () => {
    it("should parse valid ISO date", () => {
      const result = parseUrlDate("2024-01-15");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString().split("T")[0]).toBe("2024-01-15");
    });

    it("should parse date at year boundaries", () => {
      expect(parseUrlDate("2024-01-01")).toBeInstanceOf(Date);
      expect(parseUrlDate("2024-12-31")).toBeInstanceOf(Date);
    });

    it("should reject invalid date formats", () => {
      expect(parseUrlDate("01/15/2024")).toBeUndefined(); // US format
      expect(parseUrlDate("2024/01/15")).toBeUndefined(); // Slashes
      expect(parseUrlDate("invalid")).toBeUndefined();
      expect(parseUrlDate("2024-1-5")).toBeUndefined(); // No zero-padding
    });

    it("should reject invalid dates", () => {
      expect(parseUrlDate("2024-13-01")).toBeUndefined(); // Invalid month
      expect(parseUrlDate("2024-01-32")).toBeUndefined(); // Invalid day
      expect(parseUrlDate("2024-02-30")).toBeUndefined(); // Invalid day for February
      expect(parseUrlDate("2024-00-01")).toBeUndefined(); // Month 0
    });

    it("should handle edge cases", () => {
      expect(parseUrlDate("")).toBeUndefined();
      expect(parseUrlDate(null)).toBeUndefined();
      expect(parseUrlDate(undefined)).toBeUndefined();
      expect(parseUrlDate("  ")).toBeUndefined();
    });

    it("should handle leap year correctly", () => {
      expect(parseUrlDate("2024-02-29")).toBeInstanceOf(Date); // 2024 is leap year
      expect(parseUrlDate("2023-02-29")).toBeUndefined(); // 2023 is not leap year
    });
  });

  describe("isValidDateString", () => {
    it("should validate correct ISO date strings", () => {
      expect(isValidDateString("2024-01-15")).toBe(true);
      expect(isValidDateString("2024-12-31")).toBe(true);
      expect(isValidDateString("2000-01-01")).toBe(true);
    });

    it("should reject invalid dates", () => {
      expect(isValidDateString("2024-13-01")).toBe(false);
      expect(isValidDateString("01/15/2024")).toBe(false);
      expect(isValidDateString("invalid")).toBe(false);
      expect(isValidDateString("2024-01-32")).toBe(false);
    });

    it("should reject invalid format", () => {
      expect(isValidDateString("2024/01/15")).toBe(false);
      expect(isValidDateString("2024-1-5")).toBe(false);
    });

    it("should handle leap year validation", () => {
      expect(isValidDateString("2024-02-29")).toBe(true); // Leap year
      expect(isValidDateString("2023-02-29")).toBe(false); // Not leap year
    });
  });
});
