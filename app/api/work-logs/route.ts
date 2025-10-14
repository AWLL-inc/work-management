import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createWorkLog,
  type GetWorkLogsOptions,
  getWorkLogs,
} from "@/lib/db/repositories/work-log-repository";
import { createWorkLogSchema, workLogSearchSchema } from "@/lib/validations";

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    // Zodバリデーション - nullをundefinedに変換
    const validationResult = workLogSearchSchema.safeParse({
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      projectIds: searchParams.get("projectIds") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      categoryIds: searchParams.get("categoryIds") || undefined,
      userId: searchParams.get("userId") || undefined,
      searchText: searchParams.get("searchText") || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: validationResult.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const validatedParams = validationResult.data;

    // Build options using validated parameters
    const options: GetWorkLogsOptions = {
      page: validatedParams.page,
      limit: validatedParams.limit,
    };

    // Non-admin users can only see their own work logs
    if (session.user.role !== "admin") {
      options.userId = session.user.id;
    } else if (validatedParams.userId) {
      // Admin can filter by specific user
      options.userId = validatedParams.userId;
    }

    // Date filtering with validation
    if (validatedParams.startDate) {
      const parsedStartDate = new Date(validatedParams.startDate);
      if (Number.isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid startDate format. Expected YYYY-MM-DD",
            },
          },
          { status: 400 },
        );
      }
      options.startDate = parsedStartDate;
    }

    if (validatedParams.endDate) {
      const parsedEndDate = new Date(validatedParams.endDate);
      if (Number.isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid endDate format. Expected YYYY-MM-DD",
            },
          },
          { status: 400 },
        );
      }
      options.endDate = parsedEndDate;
    }

    // Project filtering - handle both single and multiple
    const projectIds = validatedParams.projectIds?.split(",").filter(Boolean);
    if (projectIds && projectIds.length > 0) {
      options.projectIds = projectIds;
    } else if (validatedParams.projectId) {
      options.projectId = validatedParams.projectId;
    }

    // Category filtering - handle both single and multiple
    const categoryIds = validatedParams.categoryIds?.split(",").filter(Boolean);
    if (categoryIds && categoryIds.length > 0) {
      options.categoryIds = categoryIds;
    } else if (validatedParams.categoryId) {
      options.categoryId = validatedParams.categoryId;
    }

    // Search text filtering
    if (validatedParams.searchText) {
      options.searchText = validatedParams.searchText;
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
