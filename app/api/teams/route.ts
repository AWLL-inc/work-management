import { and, count, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { teamMembers, teams } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { createTeamSchema, listTeamsQuerySchema } from "@/lib/validations";

/**
 * GET /api/teams
 * Get all teams (or only active teams based on query parameter)
 *
 * Query Parameters:
 * - active: 'true' to get only active teams
 *
 * Response:
 * - 200: Success with teams list and member counts
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function GET(request: Request) {
  try {
    // Authenticate user
    const session = await getAuthenticatedSession();
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { active } = listTeamsQuerySchema.parse(queryParams);

    // Build query
    const conditions = [];
    if (active !== undefined) {
      conditions.push(eq(teams.isActive, active));
    }

    // Get teams with member counts
    const teamsList = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        isActive: teams.isActive,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberCount: count(teamMembers.id),
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(conditions.length > 0 ? sql`${conditions[0]}` : undefined)
      .groupBy(teams.id)
      .orderBy(teams.name);

    return NextResponse.json({
      success: true,
      data: teamsList,
    });
  } catch (error) {
    console.error("GET /api/teams error:", error);

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
          message: "Failed to retrieve teams",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/teams
 * Create a new team
 *
 * Request Body:
 * - name: string (required, unique)
 * - description: string (optional)
 *
 * Response:
 * - 201: Team created successfully
 * - 400: Validation error or duplicate name
 * - 401: Unauthorized
 * - 403: Forbidden (not admin or manager)
 * - 500: Internal server error
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await getAuthenticatedSession();
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

    // Check if user has permission (admin or manager)
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only admins and managers can create teams",
          },
        },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTeamSchema.parse(body);

    // Check if active team with same name already exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(and(eq(teams.name, validatedData.name), eq(teams.isActive, true)))
      .limit(1);

    if (existingTeam.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_NAME",
            message: "A team with this name already exists",
          },
        },
        { status: 400 },
      );
    }

    // Create team
    const [newTeam] = await db
      .insert(teams)
      .values({
        name: validatedData.name,
        description: validatedData.description ?? null,
        isActive: true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newTeam,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/teams error:", error);

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
          message: "Failed to create team",
        },
      },
      { status: 500 },
    );
  }
}
