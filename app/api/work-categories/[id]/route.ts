import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import {
  deleteWorkCategory,
  getWorkCategoryById,
  updateWorkCategory,
  workCategoryNameExists,
} from "@/lib/db/repositories/work-category-repository";
import { updateWorkCategorySchema } from "@/lib/validations";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * PUT /api/work-categories/[id]
 * Update a work category
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

    // Check admin or manager role
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin or Manager role required",
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
            message: "Invalid work category ID format",
          },
        },
        { status: 400 },
      );
    }

    // Check if work category exists
    const existingCategory = await getWorkCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Work category not found",
          },
        },
        { status: 404 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateWorkCategorySchema.parse(body);

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await workCategoryNameExists(validatedData.name, id);
      if (nameExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DUPLICATE_NAME",
              message: "A work category with this name already exists",
            },
          },
          { status: 400 },
        );
      }
    }

    // Update work category
    const updatedCategory = await updateWorkCategory(id, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: updatedCategory,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      `[PUT /api/work-categories/${(await params).id}] Error:`,
      error,
    );

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
          message: "An error occurred while updating the work category",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/work-categories/[id]
 * Delete a work category (soft delete - set isActive to false)
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

    // Check admin or manager role
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin or Manager role required",
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
            message: "Invalid work category ID format",
          },
        },
        { status: 400 },
      );
    }

    // Check if work category exists
    const existingCategory = await getWorkCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Work category not found",
          },
        },
        { status: 404 },
      );
    }

    // Delete work category (soft delete)
    await deleteWorkCategory(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(
      `[DELETE /api/work-categories/${(await params).id}] Error:`,
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the work category",
        },
      },
      { status: 500 },
    );
  }
}
