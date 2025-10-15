"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createProject as createProjectRepo,
  deleteProject as deleteProjectRepo,
  getProjectById,
  projectNameExists,
  updateProject as updateProjectRepo,
} from "@/lib/db/repositories/project-repository";
import {
  createProjectSchema,
  type UpdateProjectInput,
  updateProjectSchema,
} from "@/lib/validations";

/**
 * Server action result type
 */
interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * UUID validation regex
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Create a new project
 * @requires Authentication
 * @requires Admin role
 */
export async function createProjectAction(
  formData: FormData | Record<string, unknown>,
): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await getAuthenticatedSession();
    if (!session) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
    }

    // Check admin role
    if (session.user.role !== "admin") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required",
        },
      };
    }

    // Extract data from FormData or direct object
    const data =
      formData instanceof FormData
        ? {
            name: formData.get("name"),
            description: formData.get("description"),
            isActive: formData.get("isActive"),
          }
        : formData;

    // Validate data
    const validatedData = createProjectSchema.parse(data);

    // Check for duplicate name
    const nameExists = await projectNameExists(validatedData.name);
    if (nameExists) {
      return {
        success: false,
        error: {
          code: "DUPLICATE_NAME",
          message: "A project with this name already exists",
        },
      };
    }

    // Create project
    const project = await createProjectRepo(validatedData);

    // Revalidate paths that display projects
    revalidatePath("/projects");
    revalidatePath("/work-logs");

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error("[createProjectAction] Error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.issues,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred while creating the project",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}

/**
 * Update an existing project
 * @requires Authentication
 * @requires Admin role
 */
export async function updateProjectAction(
  id: string,
  formData: FormData | UpdateProjectInput,
): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await getAuthenticatedSession();
    if (!session) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
    }

    // Check admin role
    if (session.user.role !== "admin") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required",
        },
      };
    }

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid project ID format",
        },
      };
    }

    // Check if project exists
    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Project not found",
        },
      };
    }

    // Extract data from FormData or direct object
    const data =
      formData instanceof FormData
        ? {
            name: formData.get("name") || undefined,
            description: formData.get("description") || undefined,
            isActive: formData.get("isActive") || undefined,
          }
        : formData;

    // Validate data
    const validatedData = updateProjectSchema.parse(data);

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingProject.name) {
      const nameExists = await projectNameExists(validatedData.name, id);
      if (nameExists) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_NAME",
            message: "A project with this name already exists",
          },
        };
      }
    }

    // Update project
    const project = await updateProjectRepo(id, validatedData);

    // Revalidate paths that display projects
    revalidatePath("/projects");
    revalidatePath("/work-logs");

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error("[updateProjectAction] Error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.issues,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred while updating the project",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}

/**
 * Delete a project (soft delete - set isActive to false)
 * @requires Authentication
 * @requires Admin role
 */
export async function deleteProjectAction(id: string): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await getAuthenticatedSession();
    if (!session) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
    }

    // Check admin role
    if (session.user.role !== "admin") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required",
        },
      };
    }

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid project ID format",
        },
      };
    }

    // Check if project exists
    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Project not found",
        },
      };
    }

    // Delete project (soft delete)
    await deleteProjectRepo(id);

    // Revalidate paths that display projects
    revalidatePath("/projects");
    revalidatePath("/work-logs");

    return {
      success: true,
    };
  } catch (error) {
    console.error("[deleteProjectAction] Error:", error);

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred while deleting the project",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}
