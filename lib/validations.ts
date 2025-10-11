import { z } from "zod";

/**
 * Validation Schemas for API Requests
 * Using Zod for runtime type checking and validation
 */

/**
 * Project Validation Schemas
 */

// Create project schema
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name must be 255 characters or less")
    .trim(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// Update project schema
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name must be 255 characters or less")
    .trim()
    .optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Query parameters for listing projects
export const listProjectsQuerySchema = z.object({
  active: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
});

/**
 * Work Category Validation Schemas
 */

// Create work category schema
export const createWorkCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(255, "Category name must be 255 characters or less")
    .trim(),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// Update work category schema
export const updateWorkCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(255, "Category name must be 255 characters or less")
    .trim()
    .optional(),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Work Log Validation Schemas
 */

// Create work log schema
export const createWorkLogSchema = z.object({
  date: z.string().date().or(z.string().datetime()).or(z.date()),
  hours: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Hours must be a valid decimal number")
    .refine((val) => parseFloat(val) > 0, "Hours must be greater than 0")
    .refine(
      (val) => parseFloat(val) <= 168,
      "Hours cannot exceed 168 (1 week)",
    ),
  projectId: z.string().uuid("Invalid project ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  details: z.string().optional().nullable(),
});

// Update work log schema
export const updateWorkLogSchema = z.object({
  date: z.string().date().or(z.string().datetime()).or(z.date()).optional(),
  hours: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Hours must be a valid decimal number")
    .refine((val) => parseFloat(val) > 0, "Hours must be greater than 0")
    .refine((val) => parseFloat(val) <= 168, "Hours cannot exceed 168 (1 week)")
    .optional(),
  projectId: z.string().uuid("Invalid project ID").optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  details: z.string().optional().nullable(),
});

/**
 * Type exports for TypeScript
 */
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

export type CreateWorkCategoryInput = z.infer<typeof createWorkCategorySchema>;
export type UpdateWorkCategoryInput = z.infer<typeof updateWorkCategorySchema>;

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
