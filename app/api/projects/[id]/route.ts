import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import {
  deleteProject,
  getProjectById,
  projectNameExists,
  updateProject,
} from "@/lib/db/repositories/project-repository";
import { updateProjectSchema } from "@/lib/validations";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * PUT /api/projects/[id]
 * Update a project
 * @requires Authentication
 * @requires Admin role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    // Check admin role
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin role required",
          },
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid project ID format",
          },
        },
        { status: 400 },
      );
    }

    // Check if project exists
    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Project not found",
          },
        },
        { status: 404 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingProject.name) {
      const nameExists = await projectNameExists(validatedData.name, id);
      if (nameExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DUPLICATE_NAME",
              message: "A project with this name already exists",
            },
          },
          { status: 400 },
        );
      }
    }

    // Update project
    const updatedProject = await updateProject(id, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: updatedProject,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[PUT /api/projects/${(await params).id}] Error:`, error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while updating the project",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project (soft delete - set isActive to false)
 * @requires Authentication
 * @requires Admin role
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    // Check admin role
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin role required",
          },
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid project ID format",
          },
        },
        { status: 400 },
      );
    }

    // Check if project exists
    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Project not found",
          },
        },
        { status: 404 },
      );
    }

    // Delete project (soft delete)
    await deleteProject(id);

    return NextResponse.json(
      {
        success: true,
      },
      { status: 204 },
    );
  } catch (error) {
    console.error(`[DELETE /api/projects/${(await params).id}] Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the project",
        },
      },
      { status: 500 },
    );
  }
}
