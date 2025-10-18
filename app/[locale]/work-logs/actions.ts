"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createWorkLog as dbCreateWorkLog,
  deleteWorkLog as dbDeleteWorkLog,
  getWorkLogs as dbGetWorkLogs,
  updateWorkLog as dbUpdateWorkLog,
} from "@/lib/api/work-logs";
import { getAuthenticatedSession } from "@/lib/auth-helpers";

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
    const result = await dbCreateWorkLog(validated);

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
    const result = await dbUpdateWorkLog(id, validated);

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
    const workLogs = await dbGetWorkLogs(options);

    return { success: true, data: workLogs };
  } catch (error) {
    console.error("Get work logs failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
