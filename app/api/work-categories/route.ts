import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createWorkCategory,
  getAllWorkCategories,
  workCategoryNameExists,
} from "@/lib/db/repositories/work-category-repository";
import {
  createWorkCategorySchema,
  listProjectsQuerySchema,
} from "@/lib/validations";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * GET /api/work-categories
 * Get all work categories
 * @requires Authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthenticatedSession();
    if (!session) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const { active } = listProjectsQuerySchema.parse(queryParams);

    // Get work categories from repository
    const categories = await getAllWorkCategories({
      activeOnly: active,
    });

    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/work-categories] Error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
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
          message: "An error occurred while fetching work categories",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/work-categories
 * Create a new work category
 * @requires Authentication
 * @requires Admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthenticatedSession();
    if (!session) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createWorkCategorySchema.parse(body);

    // Check for duplicate name
    const nameExists = await workCategoryNameExists(validatedData.name);
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

    // Create work category
    const category = await createWorkCategory(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/work-categories] Error:", error);

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
          message: "An error occurred while creating the work category",
        },
      },
      { status: 500 },
    );
  }
}
