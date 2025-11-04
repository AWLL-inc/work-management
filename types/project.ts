import type { Project } from "@/drizzle/schema";

/**
 * Input type for creating a new project
 */
export type CreateProjectInput = {
  name: string;
  description?: string;
  isActive: boolean;
};

/**
 * Input type for updating an existing project
 */
export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

/**
 * Form values type for project form dialog
 * Identical to CreateProjectInput for consistency
 */
export type ProjectFormValues = CreateProjectInput;

/**
 * Type guard to check if a value is a valid Project
 */
export function isProject(value: unknown): value is Project {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "isActive" in value
  );
}
