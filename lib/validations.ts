import { z } from "zod";

/**
 * Validation Schemas for API Requests
 * Using Zod for runtime type checking and validation
 */

/**
 * Common validation constraints shared between frontend and backend
 */
export const WORK_LOG_CONSTRAINTS = {
  HOURS: {
    MIN: 0,
    MAX: 168,
    MAX_LENGTH: 5,
    PATTERN: /^\d+(\.\d{1,2})?$/,
  },
  DETAILS: {
    MAX_LENGTH: 1000,
  },
  DATE: {
    FORMAT: /^\d{4}-\d{2}-\d{2}$/,
  },
} as const;

/**
 * Project Validation Schemas
 */

// Create project schema
export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, "Project name is required")
      .max(255, "Project name must be 255 characters or less")
      .trim()
      .describe("Project name (max 255 characters)"),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("Optional project description"),
    isActive: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether the project is active (default: true)"),
  })
  .describe("Schema for creating a new project");

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
export const listProjectsQuerySchema = z
  .object({
    active: z
      .string()
      .optional()
      .transform((val) => val === "true")
      .pipe(z.boolean())
      .describe("Filter by active status (true/false)"),
  })
  .describe("Query parameters for listing projects");

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
    .regex(
      WORK_LOG_CONSTRAINTS.HOURS.PATTERN,
      "Hours must be a valid decimal number",
    )
    .refine(
      (val) => parseFloat(val) > WORK_LOG_CONSTRAINTS.HOURS.MIN,
      "Hours must be greater than 0",
    )
    .refine(
      (val) => parseFloat(val) <= WORK_LOG_CONSTRAINTS.HOURS.MAX,
      "Hours cannot exceed 168 (1 week)",
    ),
  projectId: z.string().uuid("Invalid project ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  details: z
    .string()
    .max(
      WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH,
      "Details must be 1000 characters or less",
    )
    .optional()
    .nullable(),
});

// Update work log schema
export const updateWorkLogSchema = z.object({
  date: z.string().date().or(z.string().datetime()).or(z.date()).optional(),
  hours: z
    .string()
    .regex(
      WORK_LOG_CONSTRAINTS.HOURS.PATTERN,
      "Hours must be a valid decimal number",
    )
    .refine(
      (val) => parseFloat(val) > WORK_LOG_CONSTRAINTS.HOURS.MIN,
      "Hours must be greater than 0",
    )
    .refine(
      (val) => parseFloat(val) <= WORK_LOG_CONSTRAINTS.HOURS.MAX,
      "Hours cannot exceed 168 (1 week)",
    )
    .optional(),
  projectId: z.string().uuid("Invalid project ID").optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  details: z
    .string()
    .max(
      WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH,
      "Details must be 1000 characters or less",
    )
    .optional()
    .nullable(),
});

/**
 * Type exports for TypeScript
 */
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

export type CreateWorkCategoryInput = z.infer<typeof createWorkCategorySchema>;
export type UpdateWorkCategoryInput = z.infer<typeof updateWorkCategorySchema>;

/**
 * Field validation functions for frontend use
 */
export interface FieldValidationResult {
  valid: boolean;
  message?: string;
}

export const validateWorkLogField = {
  hours: (value: string): FieldValidationResult => {
    if (!value) {
      return { valid: false, message: "時間を入力してください" };
    }
    if (!WORK_LOG_CONSTRAINTS.HOURS.PATTERN.test(value)) {
      return {
        valid: false,
        message: "数値で入力してください（例: 8 または 8.5）",
      };
    }
    const hours = parseFloat(value);
    if (hours <= WORK_LOG_CONSTRAINTS.HOURS.MIN) {
      return { valid: false, message: "0より大きい値を入力してください" };
    }
    if (hours > WORK_LOG_CONSTRAINTS.HOURS.MAX) {
      return { valid: false, message: "168以下で入力してください" };
    }
    return { valid: true };
  },

  date: (value: string): FieldValidationResult => {
    if (!value) {
      return { valid: false, message: "日付を入力してください" };
    }
    if (!WORK_LOG_CONSTRAINTS.DATE.FORMAT.test(value)) {
      return {
        valid: false,
        message: "有効な日付をYYYY-MM-DD形式で入力してください",
      };
    }
    return { valid: true };
  },
} as const;

/**
 * Batch update schema for work logs
 */
export const batchUpdateWorkLogsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    data: updateWorkLogSchema,
  }),
);

/**
 * Type exports for TypeScript
 */
export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
export type BatchUpdateWorkLogsInput = z.infer<
  typeof batchUpdateWorkLogsSchema
>;

/**
 * Work Log Search Validation Schema
 * For validating query parameters in the work logs API
 */
export const workLogSearchSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
      .transform((val) => {
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date;
      })
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
      .transform((val) => {
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date;
      })
      .optional(),
    projectId: z.string().uuid().optional(), // Legacy single project filter
    projectIds: z.string().optional(), // New multiple projects filter (comma-separated)
    categoryId: z.string().uuid().optional(), // Legacy single category filter
    categoryIds: z.string().optional(), // New multiple categories filter (comma-separated)
    userId: z.string().uuid().optional(), // Admin only
    searchText: z.string().max(500).optional(),
    scope: z
      .enum(["own", "team", "all"], {
        message: "Scope must be 'own', 'team', or 'all'",
      })
      .optional()
      .default("own"), // Scope for team-based filtering
  })
  .refine(
    (data) => {
      // If both startDate and endDate are provided, startDate should be <= endDate
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["startDate"],
    },
  );

export type WorkLogSearchQuery = z.infer<typeof workLogSearchSchema>;

// Enhanced type exports for better type safety
export type WorkLogSearchParams = z.input<typeof workLogSearchSchema>;
export type WorkLogSearchValidated = z.output<typeof workLogSearchSchema>;

/**
 * Team Validation Schemas
 */

// Create team schema
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(255, "Team name must be 255 characters or less")
    .trim(),
  description: z.string().optional().nullable(),
});

// Update team schema
export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(255, "Team name must be 255 characters or less")
    .trim()
    .optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Query parameters for listing teams
export const listTeamsQuerySchema = z.object({
  active: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
});

/**
 * Team Member Validation Schemas
 */

// Add team member schema
export const addTeamMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z
    .enum(["member", "leader", "viewer"], {
      message: "Role must be 'member', 'leader', or 'viewer'",
    })
    .default("member"),
});

/**
 * Type exports for Teams
 */
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
