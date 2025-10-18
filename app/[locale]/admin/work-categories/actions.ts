"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createWorkCategory as dbCreateWorkCategory,
  deleteWorkCategory as dbDeleteWorkCategory,
  getWorkCategories as dbGetWorkCategories,
  updateWorkCategory as dbUpdateWorkCategory,
} from "@/lib/api/work-categories";
import { getAuthenticatedSession } from "@/lib/auth-helpers";

// Validation schemas
const createWorkCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

const updateWorkCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function createWorkCategoryAction(formData: FormData) {
  try {
    // Authentication and authorization check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "admin") {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // Validation
    const validated = createWorkCategorySchema.parse({
      name: formData.get("name"),
      description: formData.get("description") || null,
      displayOrder: Number.parseInt(formData.get("displayOrder") as string, 10),
      isActive: formData.get("isActive") === "true",
    });

    // Database operation
    const result = await dbCreateWorkCategory(validated);

    // Cache revalidation
    revalidatePath("/[locale]/admin/work-categories");

    return { success: true, data: result };
  } catch (error) {
    console.error("Create work category failed:", error);
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

export async function updateWorkCategoryAction(id: string, formData: FormData) {
  try {
    // Authentication and authorization check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "admin") {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // Validation
    const validated = updateWorkCategorySchema.parse({
      name: formData.get("name") || undefined,
      description: formData.get("description") || null,
      displayOrder:
        formData.get("displayOrder") !== null
          ? Number.parseInt(formData.get("displayOrder") as string, 10)
          : undefined,
      isActive:
        formData.get("isActive") !== null
          ? formData.get("isActive") === "true"
          : undefined,
    });

    // Database operation
    const result = await dbUpdateWorkCategory(id, validated);

    // Cache revalidation
    revalidatePath("/[locale]/admin/work-categories");

    return { success: true, data: result };
  } catch (error) {
    console.error("Update work category failed:", error);
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

export async function deleteWorkCategoryAction(id: string) {
  try {
    // Authentication and authorization check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "admin") {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // Database operation
    await dbDeleteWorkCategory(id);

    // Cache revalidation
    revalidatePath("/[locale]/admin/work-categories");

    return { success: true };
  } catch (error) {
    console.error("Delete work category failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

export async function getWorkCategoriesAction(activeOnly = false) {
  try {
    // Authentication check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Database operation
    const categories = await dbGetWorkCategories(activeOnly);

    return { success: true, data: categories };
  } catch (error) {
    console.error("Get work categories failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
