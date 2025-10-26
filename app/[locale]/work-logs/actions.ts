"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createWorkLog as dbCreateWorkLog,
  deleteWorkLog as dbDeleteWorkLog,
  getWorkLogs as dbGetWorkLogs,
  updateWorkLog as dbUpdateWorkLog,
} from "@/lib/db/repositories/work-log-repository";

// Validation schemas
const createWorkLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  hours: z.string().min(1, "Hours is required"),
  projectId: z.string().uuid("Invalid project ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  details: z.string().nullable().optional(),
});

const updateWorkLogSchema = z.object({
  date: z.string().optional(),
  hours: z.string().optional(),
  projectId: z.string().uuid("Invalid project ID").optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  details: z.string().nullable().optional(),
});

export async function createWorkLogAction(formData: FormData) {
  try {
    // Authentication check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validation
    const validated = createWorkLogSchema.parse({
      date: formData.get("date"),
      hours: formData.get("hours"),
      projectId: formData.get("projectId"),
      categoryId: formData.get("categoryId"),
      details: formData.get("details") || null,
    });

    // Database operation
    const result = await dbCreateWorkLog({
      userId: session.user.id,
      date: new Date(validated.date),
      hours: validated.hours,
      projectId: validated.projectId,
      categoryId: validated.categoryId,
      details: validated.details || null,
    });

    // Cache revalidation
    revalidatePath("/[locale]/work-logs");

    return { success: true, data: result };
  } catch (error) {
    console.error("Create work log failed:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

export async function updateWorkLogAction(id: string, formData: FormData) {
  try {
    // Authentication check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validation
    const validated = updateWorkLogSchema.parse({
      date: formData.get("date") || undefined,
      hours: formData.get("hours") || undefined,
      projectId: formData.get("projectId") || undefined,
      categoryId: formData.get("categoryId") || undefined,
      details: formData.get("details") || null,
    });

    // Database operation
    const result = await dbUpdateWorkLog(id, {
      ...validated,
      date: validated.date ? new Date(validated.date) : undefined,
    });

    // Cache revalidation
    revalidatePath("/[locale]/work-logs");

    return { success: true, data: result };
  } catch (error) {
    console.error("Update work log failed:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

export async function deleteWorkLogAction(id: string) {
  try {
    // Authentication check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Database operation
    await dbDeleteWorkLog(id);

    // Cache revalidation
    revalidatePath("/[locale]/work-logs");

    return { success: true };
  } catch (error) {
    console.error("Delete work log failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

export async function getWorkLogsAction(options?: {
  startDate?: string;
  endDate?: string;
  projectIds?: string;
  categoryIds?: string;
  userId?: string;
}) {
  try {
    // Authentication check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Database operation
    const result = await dbGetWorkLogs({
      startDate: options?.startDate ? new Date(options.startDate) : undefined,
      endDate: options?.endDate ? new Date(options.endDate) : undefined,
      projectIds: options?.projectIds?.split(","),
      categoryIds: options?.categoryIds?.split(","),
      userId: session.user.role === "admin" ? options?.userId : session.user.id,
    });

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Get work logs failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
