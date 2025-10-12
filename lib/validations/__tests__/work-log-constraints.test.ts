import { describe, expect, it } from "vitest";
import {
  createWorkLogSchema,
  updateWorkLogSchema,
  WORK_LOG_CONSTRAINTS,
} from "../../validations";

describe("Work Log Constraints", () => {
  describe("WORK_LOG_CONSTRAINTS", () => {
    it("should have correct hours constraints", () => {
      expect(WORK_LOG_CONSTRAINTS.HOURS.MIN).toBe(0);
      expect(WORK_LOG_CONSTRAINTS.HOURS.MAX).toBe(168); // 1 week = 7 days * 24 hours
      expect(WORK_LOG_CONSTRAINTS.HOURS.MAX_LENGTH).toBe(5);
      expect(WORK_LOG_CONSTRAINTS.HOURS.PATTERN).toBeInstanceOf(RegExp);
    });

    it("should validate hours pattern correctly", () => {
      const pattern = WORK_LOG_CONSTRAINTS.HOURS.PATTERN;

      // Valid patterns
      expect(pattern.test("8")).toBe(true);
      expect(pattern.test("8.0")).toBe(true);
      expect(pattern.test("8.5")).toBe(true);
      expect(pattern.test("8.25")).toBe(true);
      expect(pattern.test("0")).toBe(true);
      expect(pattern.test("0.5")).toBe(true);

      // Invalid patterns
      expect(pattern.test("8.")).toBe(false);
      expect(pattern.test(".5")).toBe(false);
      expect(pattern.test("8.123")).toBe(false); // More than 2 decimal places
      expect(pattern.test("abc")).toBe(false);
      expect(pattern.test("8a")).toBe(false);
      expect(pattern.test("-8")).toBe(false);
    });

    it("should have correct details constraints", () => {
      expect(WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH).toBe(1000);
    });

    it("should validate date format correctly", () => {
      const pattern = WORK_LOG_CONSTRAINTS.DATE.FORMAT;

      // Valid formats
      expect(pattern.test("2024-01-15")).toBe(true);
      expect(pattern.test("2024-12-31")).toBe(true);

      // Invalid formats
      expect(pattern.test("2024/01/15")).toBe(false);
      expect(pattern.test("01-15-2024")).toBe(false);
      expect(pattern.test("2024-1-15")).toBe(false);
      expect(pattern.test("24-01-15")).toBe(false);
    });
  });

  describe("createWorkLogSchema", () => {
    it("should validate valid work log data", () => {
      const validData = {
        date: "2024-01-15",
        hours: "8.5",
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        categoryId: "550e8400-e29b-41d4-a716-446655440001",
        details: "Valid work log entry",
      };

      const result = createWorkLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid hours", () => {
      const invalidData = {
        date: "2024-01-15",
        hours: "0", // Should be > 0
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        categoryId: "550e8400-e29b-41d4-a716-446655440001",
      };

      const result = createWorkLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject hours exceeding maximum", () => {
      const invalidData = {
        date: "2024-01-15",
        hours: "200", // Exceeds 168 hours
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        categoryId: "550e8400-e29b-41d4-a716-446655440001",
      };

      const result = createWorkLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID format", () => {
      const invalidData = {
        date: "2024-01-15",
        hours: "8.0",
        projectId: "invalid-uuid",
        categoryId: "550e8400-e29b-41d4-a716-446655440001",
      };

      const result = createWorkLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should validate details length constraint", () => {
      const longDetails = "a".repeat(1001); // Exceeds 1000 characters
      const invalidData = {
        date: "2024-01-15",
        hours: "8.0",
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        categoryId: "550e8400-e29b-41d4-a716-446655440001",
        details: longDetails,
      };

      const result = createWorkLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional details", () => {
      const validData = {
        date: "2024-01-15",
        hours: "8.0",
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        categoryId: "550e8400-e29b-41d4-a716-446655440001",
        // details is optional
      };

      const result = createWorkLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("updateWorkLogSchema", () => {
    it("should validate partial updates", () => {
      const partialData = {
        hours: "4.5",
      };

      const result = updateWorkLogSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("should validate empty update object", () => {
      const emptyData = {};

      const result = updateWorkLogSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid partial data", () => {
      const invalidData = {
        hours: "0", // Should be > 0
      };

      const result = updateWorkLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
