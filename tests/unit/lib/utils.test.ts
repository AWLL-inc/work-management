import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

/**
 * Unit tests for utility functions
 * Testing the cn() className merging utility
 */
describe("cn utility", () => {
  describe("basic functionality", () => {
    it("should merge single class name", () => {
      expect(cn("foo")).toBe("foo");
    });

    it("should merge multiple class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should merge multiple class names with spaces", () => {
      expect(cn("foo bar", "baz")).toBe("foo bar baz");
    });
  });

  describe("conditional classes", () => {
    it("should handle conditional classes with false values", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("should handle conditional classes with true values", () => {
      expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
    });

    it("should filter out null and undefined", () => {
      expect(cn("foo", null, undefined, "bar")).toBe("foo bar");
    });

    it("should handle empty strings", () => {
      expect(cn("foo", "", "bar")).toBe("foo bar");
    });
  });

  describe("Tailwind CSS class merging", () => {
    it("should merge conflicting Tailwind classes correctly", () => {
      // Later classes should override earlier ones
      expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("should merge different Tailwind utilities", () => {
      expect(cn("px-2 py-1", "text-center")).toBe("px-2 py-1 text-center");
    });

    it("should handle conflicting background colors", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should handle conflicting text colors", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should preserve non-conflicting classes", () => {
      expect(cn("text-sm", "px-4", "py-2", "bg-blue-500")).toBe(
        "text-sm px-4 py-2 bg-blue-500"
      );
    });
  });

  describe("array and object inputs", () => {
    it("should handle array of class names", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("should handle object with boolean values", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });

    it("should handle mixed arrays and strings", () => {
      expect(cn("foo", ["bar", "baz"], "qux")).toBe("foo bar baz qux");
    });

    it("should handle nested arrays", () => {
      expect(cn("foo", [["bar"], "baz"])).toBe("foo bar baz");
    });
  });

  describe("edge cases", () => {
    it("should handle no arguments", () => {
      expect(cn()).toBe("");
    });

    it("should handle only falsy values", () => {
      expect(cn(false, null, undefined, "")).toBe("");
    });

    it("should handle numbers", () => {
      expect(cn("foo", 0, "bar")).toBe("foo bar");
    });

    it("should trim whitespace", () => {
      expect(cn("  foo  ", "  bar  ")).toBe("foo bar");
    });

    it("should handle very long class strings", () => {
      const longClass = Array(100)
        .fill("class")
        .map((c, i) => `${c}-${i}`)
        .join(" ");
      expect(cn(longClass)).toContain("class-0");
      expect(cn(longClass)).toContain("class-99");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle button variants", () => {
      const baseClasses = "px-4 py-2 rounded font-medium";
      const variantClasses = "bg-blue-500 text-white hover:bg-blue-600";
      const result = cn(baseClasses, variantClasses);

      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
      expect(result).toContain("rounded");
      expect(result).toContain("bg-blue-500");
      expect(result).toContain("text-white");
    });

    it("should handle conditional styling", () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn(
        "base-class",
        isActive && "active-class",
        isDisabled && "disabled-class"
      );

      expect(result).toBe("base-class active-class");
    });

    it("should override default with custom classes", () => {
      const defaultClasses = "p-4 text-gray-500";
      const customClasses = "text-red-500";

      expect(cn(defaultClasses, customClasses)).toBe("p-4 text-red-500");
    });
  });
});
