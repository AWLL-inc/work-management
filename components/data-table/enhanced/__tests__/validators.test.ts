/**
 * Tests for validators
 */

import { describe, expect, it } from "vitest";
import {
  combine,
  custom,
  dateRange,
  isEmail,
  isUUID,
  isValidDate,
  numberRange,
  pattern,
  required,
  stringLength,
} from "../validators";

describe("validators", () => {
  describe("required", () => {
    it("should reject null/undefined/empty values", () => {
      const validator = required("Field is required");

      expect(validator(null).valid).toBe(false);
      expect(validator(undefined).valid).toBe(false);
      expect(validator("").valid).toBe(false);
    });

    it("should accept non-empty values", () => {
      const validator = required();

      expect(validator("test").valid).toBe(true);
      expect(validator(0).valid).toBe(true);
      expect(validator(false).valid).toBe(true);
    });

    it("should use custom message", () => {
      const validator = required("Custom message");
      const result = validator(null);

      expect(result.valid).toBe(false);
      expect(result.message).toBe("Custom message");
    });
  });

  describe("stringLength", () => {
    it("should validate minimum length", () => {
      const validator = stringLength(5);

      expect(validator("test").valid).toBe(false);
      expect(validator("testing").valid).toBe(true);
    });

    it("should validate maximum length", () => {
      const validator = stringLength(undefined, 10);

      expect(validator("test").valid).toBe(true);
      expect(validator("this is a very long string").valid).toBe(false);
    });

    it("should validate both min and max", () => {
      const validator = stringLength(5, 10);

      expect(validator("test").valid).toBe(false);
      expect(validator("testing").valid).toBe(true);
      expect(validator("this is too long").valid).toBe(false);
    });

    it("should accept null/undefined", () => {
      const validator = stringLength(5, 10);

      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
    });
  });

  describe("numberRange", () => {
    it("should validate minimum value", () => {
      const validator = numberRange(0);

      expect(validator(-1).valid).toBe(false);
      expect(validator(0).valid).toBe(true);
      expect(validator(10).valid).toBe(true);
    });

    it("should validate maximum value", () => {
      const validator = numberRange(undefined, 100);

      expect(validator(50).valid).toBe(true);
      expect(validator(100).valid).toBe(true);
      expect(validator(150).valid).toBe(false);
    });

    it("should validate both min and max", () => {
      const validator = numberRange(0, 24);

      expect(validator(-1).valid).toBe(false);
      expect(validator(12).valid).toBe(true);
      expect(validator(25).valid).toBe(false);
    });

    it("should reject non-numbers", () => {
      const validator = numberRange(0, 100);

      expect(validator("abc").valid).toBe(false);
      // String "50" should be parsed and validated as number
      const result = validator("50");
      expect(result.valid).toBe(true);
    });

    it("should accept null/undefined/empty string", () => {
      const validator = numberRange(0, 100);

      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
      expect(validator("").valid).toBe(true);
    });
  });

  describe("pattern", () => {
    it("should validate against regex", () => {
      const validator = pattern(/^\d{3}-\d{4}$/, "Invalid format");

      expect(validator("123-4567").valid).toBe(true);
      expect(validator("abc-defg").valid).toBe(false);
    });

    it("should accept null/undefined/empty", () => {
      const validator = pattern(/^\d+$/);

      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
      expect(validator("").valid).toBe(true);
    });
  });

  describe("isValidDate", () => {
    it("should validate Date objects", () => {
      const validator = isValidDate();

      expect(validator(new Date()).valid).toBe(true);
      expect(validator(new Date("invalid")).valid).toBe(false);
    });

    it("should validate date strings", () => {
      const validator = isValidDate();

      expect(validator("2024-01-01").valid).toBe(true);
      expect(validator("invalid-date").valid).toBe(false);
    });

    it("should accept null/undefined/empty", () => {
      const validator = isValidDate();

      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
      expect(validator("").valid).toBe(true);
    });
  });

  describe("dateRange", () => {
    it("should validate minimum date", () => {
      const minDate = new Date("2024-01-01");
      const validator = dateRange(minDate);

      expect(validator(new Date("2023-12-31")).valid).toBe(false);
      expect(validator(new Date("2024-01-01")).valid).toBe(true);
      expect(validator(new Date("2024-01-02")).valid).toBe(true);
    });

    it("should validate maximum date", () => {
      const maxDate = new Date("2024-12-31");
      const validator = dateRange(undefined, maxDate);

      expect(validator(new Date("2024-12-30")).valid).toBe(true);
      expect(validator(new Date("2024-12-31")).valid).toBe(true);
      expect(validator(new Date("2025-01-01")).valid).toBe(false);
    });

    it("should validate date range", () => {
      const minDate = new Date("2024-01-01");
      const maxDate = new Date("2024-12-31");
      const validator = dateRange(minDate, maxDate);

      expect(validator(new Date("2023-12-31")).valid).toBe(false);
      expect(validator(new Date("2024-06-15")).valid).toBe(true);
      expect(validator(new Date("2025-01-01")).valid).toBe(false);
    });
  });

  describe("isUUID", () => {
    it("should validate UUID format", () => {
      const validator = isUUID();

      expect(validator("123e4567-e89b-12d3-a456-426614174000").valid).toBe(
        true,
      );
      expect(validator("invalid-uuid").valid).toBe(false);
    });

    it("should accept null/undefined/empty", () => {
      const validator = isUUID();

      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
      expect(validator("").valid).toBe(true);
    });
  });

  describe("isEmail", () => {
    it("should validate email format", () => {
      const validator = isEmail();

      expect(validator("test@example.com").valid).toBe(true);
      expect(validator("invalid-email").valid).toBe(false);
      expect(validator("@example.com").valid).toBe(false);
      expect(validator("test@").valid).toBe(false);
    });

    it("should accept null/undefined/empty", () => {
      const validator = isEmail();

      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
      expect(validator("").valid).toBe(true);
    });
  });

  describe("custom", () => {
    it("should validate with custom function", () => {
      const validator = custom((value) => {
        const num = Number(value);
        return num > 0 && num <= 24;
      }, "Value must be 1-24");

      expect(validator(0).valid).toBe(false);
      expect(validator(12).valid).toBe(true);
      expect(validator(25).valid).toBe(false);
    });

    it("should accept null/undefined/empty", () => {
      const validator = custom((value) => value === "test", "Must be test");

      expect(validator(null).valid).toBe(true);
      expect(validator(undefined).valid).toBe(true);
      expect(validator("").valid).toBe(true);
    });
  });

  describe("combine", () => {
    it("should validate all validators", () => {
      const validator = combine([
        required("Required"),
        stringLength(5, 10, "Must be 5-10 chars"),
        pattern(/^\d+$/, "Must be numbers only"),
      ]);

      expect(validator("").valid).toBe(false);
      expect(validator("abc").valid).toBe(false);
      expect(validator("12345abc").valid).toBe(false);
      expect(validator("12345").valid).toBe(true);
    });

    it("should return first error", () => {
      const validator = combine([
        required("Required"),
        stringLength(5, 10, "Wrong length"),
      ]);

      const result = validator("");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Required");
    });

    it("should pass when all validators pass", () => {
      const validator = combine([
        required("Required"),
        pattern(/^\d+$/, "Numbers only"),
        numberRange(1, 100, "Range 1-100"),
      ]);

      expect(validator("50").valid).toBe(true);
    });
  });
});
