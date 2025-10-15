"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createWorkLog as createWorkLogRepo,
  deleteWorkLog as deleteWorkLogRepo,
  getWorkLogById,
  updateWorkLog as updateWorkLogRepo,
} from "@/lib/db/repositories/work-log-repository";
import {
  createWorkLogSchema,
  type UpdateWorkLogInput,
  updateWorkLogSchema,
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
 * Create a new work log
 * @requires Authentication
 */
export async function createWorkLogAction(
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

    // Extract data from FormData or direct object
    const data =
      formData instanceof FormData
        ? {
            date: formData.get("date"),
            hours: formData.get("hours"),
            projectId: formData.get("projectId"),
            categoryId: formData.get("categoryId"),
            details: formData.get("details"),
          }
        : formData;

    // Validate data
    const validatedData = createWorkLogSchema.parse(data);

    // Convert date string to Date object if needed
    const dateValue =
      typeof validatedData.date === "string"
        ? new Date(validatedData.date)
        : validatedData.date;

    // Create work log with authenticated user's ID
    const workLog = await createWorkLogRepo({
      userId: session.user.id,
      date: dateValue,
      hours: validatedData.hours,
      projectId: validatedData.projectId,
      categoryId: validatedData.categoryId,
      details: validatedData.details || null,
    });

    // Revalidate paths that display work logs
    revalidatePath("/work-logs");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: workLog,
    };
  } catch (error) {
    console.error("[createWorkLogAction] Error:", error);

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
        message: "An error occurred while creating the work log",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}

/**
 * Update an existing work log
 * @requires Authentication
 * @requires Owner or Admin role
 */
export async function updateWorkLogAction(
  id: string,
  formData: FormData | UpdateWorkLogInput,
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

    // Check if work log exists and user has permission
    const existingWorkLog = await getWorkLogById(id);
    if (!existingWorkLog) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Work log not found",
        },
      };
    }

    // Check authorization: user must own the work log or be an admin
    if (
      existingWorkLog.userId !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to update this work log",
        },
      };
    }

    // Extract data from FormData or direct object
    const data =
      formData instanceof FormData
        ? {
            date: formData.get("date") || undefined,
            hours: formData.get("hours") || undefined,
            projectId: formData.get("projectId") || undefined,
            categoryId: formData.get("categoryId") || undefined,
            details: formData.get("details") || undefined,
          }
        : formData;

    // Validate data
    const validatedData = updateWorkLogSchema.parse(data);

    // Convert date string to Date object if provided
    const dateValue = validatedData.date
      ? typeof validatedData.date === "string"
        ? new Date(validatedData.date)
        : validatedData.date
      : undefined;

    // Update work log
    const workLog = await updateWorkLogRepo(id, {
      ...validatedData,
      date: dateValue,
    });

    // Revalidate paths that display work logs
    revalidatePath("/work-logs");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: workLog,
    };
  } catch (error) {
    console.error("[updateWorkLogAction] Error:", error);

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
        message: "An error occurred while updating the work log",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}

/**
 * Delete a work log
 * @requires Authentication
 * @requires Owner or Admin role
 */
export async function deleteWorkLogAction(id: string): Promise<ActionResult> {
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

    // Check if work log exists and user has permission
    const existingWorkLog = await getWorkLogById(id);
    if (!existingWorkLog) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Work log not found",
        },
      };
    }

    // Check authorization: user must own the work log or be an admin
    if (
      existingWorkLog.userId !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to delete this work log",
        },
      };
    }

    // Delete work log
    await deleteWorkLogRepo(id);

    // Revalidate paths that display work logs
    revalidatePath("/work-logs");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("[deleteWorkLogAction] Error:", error);

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred while deleting the work log",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
    };
  }
}
