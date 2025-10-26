import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { teamMembers, teams, users } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { updateTeamSchema } from "@/lib/validations";

/**
 * GET /api/teams/[id]
 * Get team details with members list
 *
 * Response:
 * - 200: Success with team details and members
 * - 401: Unauthorized
 * - 404: Team not found
 * - 500: Internal server error
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: teamId } = await params;

    // Get team details
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

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

    // Get team members with user information
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        userName: users.name,
        userEmail: users.email,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(teamMembers.joinedAt);

    return NextResponse.json({
      success: true,
      data: {
        ...team,
        members,
      },
    });
  } catch (error) {
    console.error(`GET /api/teams/[id] error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve team details",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/teams/[id]
 * Update team information
 *
 * Request Body:
 * - name: string (optional)
 * - description: string (optional)
 * - isActive: boolean (optional)
 *
 * Response:
 * - 200: Team updated successfully
 * - 400: Validation error or duplicate name
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Team not found
 * - 500: Internal server error
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only admins can update teams",
          },
        },
        { status: 403 },
      );
    }

    const { id: teamId } = await params;

    // Check if team exists
    const [existingTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!existingTeam) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTeamSchema.parse(body);

    // If name is being updated, check for duplicates among active teams
    if (validatedData.name && validatedData.name !== existingTeam.name) {
      const [duplicateTeam] = await db
        .select()
        .from(teams)
        .where(
          and(eq(teams.name, validatedData.name), eq(teams.isActive, true)),
        )
        .limit(1);

      if (duplicateTeam) {
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
    }

    // Update team
    const [updatedTeam] = await db
      .update(teams)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    console.error(`PUT /api/teams/[id] error:`, error);

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
          message: "Failed to update team",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/teams/[id]
 * Soft delete a team (set isActive to false)
 *
 * Response:
 * - 200: Team deleted successfully
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Team not found
 * - 500: Internal server error
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only admins can delete teams",
          },
        },
        { status: 403 },
      );
    }

    const { id: teamId } = await params;

    // Check if team exists
    const [existingTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!existingTeam) {
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

    // Soft delete team (set isActive to false)
    await db
      .update(teams)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(`DELETE /api/teams/[id] error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete team",
        },
      },
      { status: 500 },
    );
  }
}
