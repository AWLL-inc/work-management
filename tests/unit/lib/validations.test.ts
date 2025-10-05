import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "@/lib/validations";

describe("Project Validation Schemas", () => {
  describe("createProjectSchema", () => {
    it("should validate valid project data", () => {
      const validData = {
        name: "Test Project",
        description: "A test project",
        isActive: true,
      };

      const result = createProjectSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it("should apply default isActive value", () => {
      const data = {
        name: "Test Project",
      };

      const result = createProjectSchema.parse(data);

      expect(result.isActive).toBe(true);
    });

    it("should trim project name", () => {
      const data = {
        name: "  Test Project  ",
      };

      const result = createProjectSchema.parse(data);

      expect(result.name).toBe("Test Project");
    });

    it("should accept nullable description", () => {
      const data = {
        name: "Test Project",
        description: null,
      };

      const result = createProjectSchema.parse(data);

      expect(result.description).toBeNull();
    });

    it("should reject empty name", () => {
      const data = {
        name: "",
      };

      expect(() => createProjectSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject name longer than 255 characters", () => {
      const data = {
        name: "a".repeat(256),
      };

      expect(() => createProjectSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject missing name", () => {
      const data = {
        description: "Test",
      };

      expect(() => createProjectSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("updateProjectSchema", () => {
    it("should validate valid update data", () => {
      const validData = {
        name: "Updated Project",
        description: "Updated description",
        isActive: false,
      };

      const result = updateProjectSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it("should allow partial updates", () => {
      const data = {
        name: "Updated Name",
      };

      const result = updateProjectSchema.parse(data);

      expect(result.name).toBe("Updated Name");
      expect(result.description).toBeUndefined();
      expect(result.isActive).toBeUndefined();
    });

    it("should trim project name", () => {
      const data = {
        name: "  Updated Project  ",
      };

      const result = updateProjectSchema.parse(data);

      expect(result.name).toBe("Updated Project");
    });

    it("should allow updating only description", () => {
      const data = {
        description: "New description",
      };

      const result = updateProjectSchema.parse(data);

      expect(result.description).toBe("New description");
    });

    it("should allow updating only isActive", () => {
      const data = {
        isActive: false,
      };

      const result = updateProjectSchema.parse(data);

      expect(result.isActive).toBe(false);
    });

    it("should reject empty name if provided", () => {
      const data = {
        name: "",
      };

      expect(() => updateProjectSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject name longer than 255 characters", () => {
      const data = {
        name: "a".repeat(256),
      };

      expect(() => updateProjectSchema.parse(data)).toThrow(ZodError);
    });

    it("should allow empty update object", () => {
      const data = {};

      const result = updateProjectSchema.parse(data);

      expect(result).toEqual({});
    });
  });

  describe("listProjectsQuerySchema", () => {
    it("should parse active=true query parameter", () => {
      const data = {
        active: "true",
      };

      const result = listProjectsQuerySchema.parse(data);

      expect(result.active).toBe(true);
    });

    it("should parse active=false query parameter", () => {
      const data = {
        active: "false",
      };

      const result = listProjectsQuerySchema.parse(data);

      expect(result.active).toBe(false);
    });

    it("should handle missing active parameter", () => {
      const data = {};

      const result = listProjectsQuerySchema.parse(data);

      expect(result.active).toBe(false);
    });

    it("should handle invalid active parameter as false", () => {
      const data = {
        active: "invalid",
      };

      const result = listProjectsQuerySchema.parse(data);

      // Note: The transform converts "invalid" to false (since it's not "true")
      expect(result.active).toBe(false);
    });
  });
});
