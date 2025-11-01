import { eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { teamMembers } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { getProjectStats } from "@/lib/db/repositories/dashboard-repository";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

// Query parameter schema
const projectStatsSchema = z.object({
  period: z
    .enum(["today", "week", "month", "custom"])
    .optional()
    .default("week"),
  startDate: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid date format for startDate",
        });
        return z.NEVER;
      }
      return date;
    }),
  endDate: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid date format for endDate",
        });
        return z.NEVER;
      }
      return date;
    }),
  projectId: z.string().uuid().optional(),
  scope: z.enum(["own", "team", "all"]).optional().default("own"),
});

/**
 * GET /api/dashboard/projects
 * Get project statistics
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

    const validationResult = projectStatsSchema.safeParse({
      period: searchParams.get("period") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      projectId: searchParams.get("projectId") || undefined,
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

    // Validate custom period
    if (validatedParams.period === "custom") {
      if (!validatedParams.startDate || !validatedParams.endDate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Start and end dates are required for custom period",
            },
          },
          { status: 400 },
        );
      }
    }

    // Handle scope-based access control
    const scope = validatedParams.scope;
    let userId: string | undefined;
    let userIds: string[] | undefined;

    if (scope === "all") {
      // Only admin can view all projects
      if (session.user.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only admins can view all project statistics",
            },
          },
          { status: 403 },
        );
      }
      // Admin viewing all - no user filter
      userId = undefined;
      userIds = undefined;
    } else if (scope === "team") {
      // Get all teams the user belongs to
      const userTeams = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, session.user.id));

      if (userTeams.length > 0) {
        // Get all team IDs the user belongs to
        const teamIds = userTeams.map((tm) => tm.teamId);

        // Get all users in those teams
        const allMembers = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .where(inArray(teamMembers.teamId, teamIds));

        // Include current user and deduplicate
        const uniqueTeammateIds = Array.from(
          new Set([session.user.id, ...allMembers.map((m) => m.userId)]),
        );

        userIds = uniqueTeammateIds;
      } else {
        // User is not in any team, show only their own data
        userId = session.user.id;
      }
    } else {
      // scope === "own" (default)
      userId = session.user.id;
    }

    // Get project statistics
    const stats = await getProjectStats({
      userId,
      userIds,
      period: validatedParams.period,
      startDate: validatedParams.startDate,
      endDate: validatedParams.endDate,
      projectId: validatedParams.projectId,
      scope,
    });

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/dashboard/projects] Error:", error);

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
          message: "An error occurred while fetching project statistics",
          ...(process.env.NODE_ENV === "development" && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      },
      { status: 500 },
    );
  }
}
