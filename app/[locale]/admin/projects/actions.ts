"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createProject as dbCreateProject,
  deleteProject as dbDeleteProject,
  getProjects as dbGetProjects,
  updateProject as dbUpdateProject,
} from "@/lib/api/projects";
import { getAuthenticatedSession } from "@/lib/auth-helpers";

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function createProjectAction(formData: FormData) {
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
    const validated = createProjectSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") || null,
      isActive: formData.get("isActive") === "true",
    });

    // Database operation
    const result = await dbCreateProject(validated);

    // Cache revalidation
    revalidatePath("/[locale]/admin/projects");

    return { success: true, data: result };
  } catch (error) {
    console.error("Create project failed:", error);
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

export async function updateProjectAction(id: string, formData: FormData) {
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
    const validated = updateProjectSchema.parse({
      name: formData.get("name") || undefined,
      description: formData.get("description") || null,
      isActive:
        formData.get("isActive") !== null
          ? formData.get("isActive") === "true"
          : undefined,
    });

    // Database operation
    const result = await dbUpdateProject(id, validated);

    // Cache revalidation
    revalidatePath("/[locale]/admin/projects");

    return { success: true, data: result };
  } catch (error) {
    console.error("Update project failed:", error);
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

export async function deleteProjectAction(id: string) {
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
    await dbDeleteProject(id);

    // Cache revalidation
    revalidatePath("/[locale]/admin/projects");

    return { success: true };
  } catch (error) {
    console.error("Delete project failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

export async function getProjectsAction(activeOnly = false) {
  try {
    // Authentication check
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Database operation
    const projects = await dbGetProjects(activeOnly);

    return { success: true, data: projects };
  } catch (error) {
    console.error("Get projects failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}
