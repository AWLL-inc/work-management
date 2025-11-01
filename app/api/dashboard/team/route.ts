import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { teamMembers, teams } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { getTeamStats } from "@/lib/db/repositories/dashboard-repository";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

// Query parameter schema
const teamStatsSchema = z.object({
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
  teamId: z.string().uuid().optional(),
});

/**
 * GET /api/dashboard/team
 * Get team statistics
 * @requires Authentication (team member or admin)
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

    const validationResult = teamStatsSchema.safeParse({
      period: searchParams.get("period") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      teamId: searchParams.get("teamId") || undefined,
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

    // Get user's teams
    const userTeams = await db
      .select({
        teamId: teamMembers.teamId,
        teamName: teams.name,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, session.user.id));

    // If teamId is specified, check if user has access
    let targetTeamId: string;
    let targetTeamName: string;

    if (validatedParams.teamId) {
      // Admin can view any team, others need to be a member
      if (session.user.role === "admin") {
        const [team] = await db
          .select({ id: teams.id, name: teams.name })
          .from(teams)
          .where(eq(teams.id, validatedParams.teamId));

        if (!team) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "NOT_FOUND",
                message: "Team not found",
              },
            },
            { status: 404 },
          );
        }

        targetTeamId = team.id;
        targetTeamName = team.name;
      } else {
        // Check if user is a member of the specified team
        const isMember = userTeams.some(
          (t) => t.teamId === validatedParams.teamId,
        );

        if (!isMember) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "You are not a member of this team",
              },
            },
            { status: 403 },
          );
        }

        const team = userTeams.find((t) => t.teamId === validatedParams.teamId);
        if (!team) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "NOT_FOUND",
                message: "Team not found",
              },
            },
            { status: 404 },
          );
        }

        targetTeamId = team.teamId;
        targetTeamName = team.teamName;
      }
    } else {
      // No teamId specified, use the first team the user belongs to
      if (userTeams.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "You are not a member of any team",
            },
          },
          { status: 404 },
        );
      }

      targetTeamId = userTeams[0].teamId;
      targetTeamName = userTeams[0].teamName;
    }

    // Get all members of the target team
    const teamMembersList = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, targetTeamId));

    const memberUserIds = teamMembersList.map((m) => m.userId);

    if (memberUserIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "No members found in this team",
          },
        },
        { status: 404 },
      );
    }

    // Get team statistics
    const stats = await getTeamStats({
      teamId: targetTeamId,
      period: validatedParams.period,
      startDate: validatedParams.startDate,
      endDate: validatedParams.endDate,
      userIds: memberUserIds,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          team: {
            teamId: targetTeamId,
            teamName: targetTeamName,
            memberCount: memberUserIds.length,
          },
          ...stats,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/dashboard/team] Error:", error);

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
          message: "An error occurred while fetching team statistics",
          ...(process.env.NODE_ENV === "development" && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      },
      { status: 500 },
    );
  }
}
