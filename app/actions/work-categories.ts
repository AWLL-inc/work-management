"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createWorkCategory as createWorkCategoryRepo,
  deleteWorkCategory as deleteWorkCategoryRepo,
  getWorkCategoryById,
  updateWorkCategory as updateWorkCategoryRepo,
  workCategoryNameExists,
} from "@/lib/db/repositories/work-category-repository";
import {
  createWorkCategorySchema,
  type UpdateWorkCategoryInput,
  updateWorkCategorySchema,
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
 * Create a new work category
 * @requires Authentication
 * @requires Admin role
 */
export async function createWorkCategoryAction(
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
            displayOrder: formData.get("displayOrder"),
            isActive: formData.get("isActive"),
          }
        : formData;

    // Validate data
    const validatedData = createWorkCategorySchema.parse(data);

    // Check for duplicate name
    const nameExists = await workCategoryNameExists(validatedData.name);
    if (nameExists) {
      return {
        success: false,
        error: {
          code: "DUPLICATE_NAME",
          message: "A work category with this name already exists",
        },
      };
    }

    // Create work category
    const category = await createWorkCategoryRepo(validatedData);

    // Revalidate paths that display work categories
    revalidatePath("/work-categories");
    revalidatePath("/work-logs");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("[createWorkCategoryAction] Error:", error);

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
        message: "An error occurred while creating the work category",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}

/**
 * Update an existing work category
 * @requires Authentication
 * @requires Admin role
 */
export async function updateWorkCategoryAction(
  id: string,
  formData: FormData | UpdateWorkCategoryInput,
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
          message: "Invalid work category ID format",
        },
      };
    }

    // Check if work category exists
    const existingCategory = await getWorkCategoryById(id);
    if (!existingCategory) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Work category not found",
        },
      };
    }

    // Extract data from FormData or direct object
    const data =
      formData instanceof FormData
        ? {
            name: formData.get("name") || undefined,
            description: formData.get("description") || undefined,
            displayOrder: formData.get("displayOrder") || undefined,
            isActive: formData.get("isActive") || undefined,
          }
        : formData;

    // Validate data
    const validatedData = updateWorkCategorySchema.parse(data);

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await workCategoryNameExists(validatedData.name, id);
      if (nameExists) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_NAME",
            message: "A work category with this name already exists",
          },
        };
      }
    }

    // Update work category
    const category = await updateWorkCategoryRepo(id, validatedData);

    // Revalidate paths that display work categories
    revalidatePath("/work-categories");
    revalidatePath("/work-logs");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("[updateWorkCategoryAction] Error:", error);

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
        message: "An error occurred while updating the work category",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}

/**
 * Delete a work category (soft delete - set isActive to false)
 * @requires Authentication
 * @requires Admin role
 */
export async function deleteWorkCategoryAction(
  id: string,
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
          message: "Invalid work category ID format",
        },
      };
    }

    // Check if work category exists
    const existingCategory = await getWorkCategoryById(id);
    if (!existingCategory) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Work category not found",
        },
      };
    }

    // Delete work category (soft delete)
    await deleteWorkCategoryRepo(id);

    // Revalidate paths that display work categories
    revalidatePath("/work-categories");
    revalidatePath("/work-logs");

    return {
      success: true,
    };
  } catch (error) {
    console.error("[deleteWorkCategoryAction] Error:", error);

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred while deleting the work category",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}
