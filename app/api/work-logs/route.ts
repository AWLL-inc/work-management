import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createWorkLog,
  getWorkLogs,
} from "@/lib/db/repositories/work-log-repository";
import { createWorkLogSchema } from "@/lib/validations";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * GET /api/work-logs
 * Get work logs with filtering and pagination
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const projectId = searchParams.get("projectId");
    // New filtering parameters
    const projectIds = searchParams
      .get("projectIds")
      ?.split(",")
      .filter(Boolean);
    const categoryId = searchParams.get("categoryId");
    const categoryIds = searchParams
      .get("categoryIds")
      ?.split(",")
      .filter(Boolean);
    const userId = searchParams.get("userId");
    const searchText = searchParams.get("searchText");

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid pagination parameters",
          },
        },
        { status: 400 },
      );
    }

    // Build options
    const options: Record<string, unknown> = {
      page,
      limit,
    };

    // Non-admin users can only see their own work logs
    if (session.user.role !== "admin") {
      options.userId = session.user.id;
    } else if (userId) {
      // Admin can filter by specific user
      options.userId = userId;
    }

    // Add date filters if provided
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // Project filtering - support both single and multiple
    if (projectIds && projectIds.length > 0) {
      options.projectIds = projectIds;
    } else if (projectId) {
      options.projectId = projectId;
    }

    // Category filtering - support both single and multiple
    if (categoryIds && categoryIds.length > 0) {
      options.categoryIds = categoryIds;
    } else if (categoryId) {
      options.categoryId = categoryId;
    }

    // Full text search in details
    if (searchText) {
      options.searchText = searchText;
    }

    // Get work logs from repository
    const { data, pagination } = await getWorkLogs(options);

    return NextResponse.json(
      {
        success: true,
        data,
        pagination,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/work-logs] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching work logs",
          ...(process.env.NODE_ENV === "development" && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/work-logs
 * Create a new work log
 * @requires Authentication
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createWorkLogSchema.parse(body);

    // Convert date string to Date object if needed
    const dateValue =
      typeof validatedData.date === "string"
        ? new Date(validatedData.date)
        : validatedData.date;

    // Create work log with authenticated user's ID
    const workLog = await createWorkLog({
      userId: session.user.id,
      date: dateValue,
      hours: validatedData.hours,
      projectId: validatedData.projectId,
      categoryId: validatedData.categoryId,
      details: validatedData.details || null,
    });

    return NextResponse.json(
      {
        success: true,
        data: workLog,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/work-logs] Error:", error);

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
          message: "An error occurred while creating the work log",
          ...(process.env.NODE_ENV === "development" && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      },
      { status: 500 },
    );
  }
}
