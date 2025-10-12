import { describe, expect, it } from "vitest";
import { formatDateForDisplay, parseDate } from "../../utils";

describe("Date Utilities", () => {
  describe("formatDateForDisplay", () => {
    it("should format valid date string correctly", () => {
      const result = formatDateForDisplay("2024-01-15");
      expect(result).toBe("2024/01/15");
    });

    it("should format Date object correctly", () => {
      const date = new Date("2024-01-15");
      const result = formatDateForDisplay(date);
      expect(result).toBe("2024/01/15");
    });

    it("should return empty string for null or undefined", () => {
      expect(formatDateForDisplay(null)).toBe("");
      expect(formatDateForDisplay(undefined)).toBe("");
    });

    it("should return original value as string for invalid dates", () => {
      const result = formatDateForDisplay("invalid-date");
      expect(result).toBe("invalid-date");
    });

    it("should handle empty string", () => {
      const result = formatDateForDisplay("");
      expect(result).toBe("");
    });

    it("should format dates with correct zero padding", () => {
      const result = formatDateForDisplay("2024-01-01");
      expect(result).toBe("2024/01/01");
    });

    it("should handle leap year dates", () => {
      const result = formatDateForDisplay("2024-02-29");
      expect(result).toBe("2024/02/29");
    });
  });

  describe("parseDate", () => {
    it("should parse valid YYYY-MM-DD format", () => {
      const result = parseDate("2024-01-15");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getDate()).toBe(15);
    });

    it("should return null for invalid format", () => {
      expect(parseDate("2024/01/15")).toBeNull();
      expect(parseDate("01-15-2024")).toBeNull();
      expect(parseDate("2024-1-15")).toBeNull();
      expect(parseDate("invalid")).toBeNull();
    });

    it("should return null for invalid dates", () => {
      expect(parseDate("2024-02-30")).toBeNull(); // February 30th doesn't exist
      expect(parseDate("2024-13-01")).toBeNull(); // Month 13 doesn't exist
    });

    it("should handle leap year correctly", () => {
      const result = parseDate("2024-02-29");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(29);
    });

    it("should return null for non-leap year February 29", () => {
      const result = parseDate("2023-02-29");
      expect(result).toBeNull();
    });

    it("should handle edge cases", () => {
      expect(parseDate("")).toBeNull();
      expect(parseDate("2024-00-01")).toBeNull();
      expect(parseDate("2024-01-00")).toBeNull();
    });
  });
});
