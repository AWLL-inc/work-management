import { eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { teamMembers } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
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
      scope: searchParams.get("scope") || undefined,
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

    // Handle scope parameter for team-based filtering
    const scope = validatedParams.scope || "own";

    if (scope === "all") {
      // Only admin can view all work logs
      if (session.user.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only admins can view all work logs",
            },
          },
          { status: 403 },
        );
      }
      // Admin viewing all - no user filter
      if (validatedParams.userId) {
        // Admin can filter by specific user
        options.userId = validatedParams.userId;
      }
    } else if (scope === "team") {
      // Get all teams the user belongs to
      const userTeams = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, session.user.id));

      if (userTeams.length > 0) {
        // Get all team IDs the user belongs to
        const teamIds = userTeams.map((tm) => tm.teamId);

        // Get all users in those teams with a single query
        // N+1 optimization: Use inArray() to fetch all members at once instead of
        // looping through teamIds with separate queries (O(1) instead of O(n))
        const allMembers = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .where(inArray(teamMembers.teamId, teamIds));

        // Include current user and deduplicate
        const uniqueTeammateIds = Array.from(
          new Set([session.user.id, ...allMembers.map((m) => m.userId)]),
        );

        options.userIds = uniqueTeammateIds;
      } else {
        // User is not in any team, show only their own work logs
        options.userId = session.user.id;
      }
    } else {
      // scope === "own" (default)
      // User can only see their own work logs
      options.userId = session.user.id;
    }

    // Date filtering - dates are already validated and transformed by Zod
    if (validatedParams.startDate) {
      options.startDate = validatedParams.startDate;
    }

    if (validatedParams.endDate) {
      options.endDate = validatedParams.endDate;
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
