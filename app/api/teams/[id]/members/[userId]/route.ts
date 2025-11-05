import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { teamMembers, teams } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { canManageTeamMembers, getTeamRole } from "@/lib/permissions";
import { updateTeamMemberSchema } from "@/lib/validations";

/**
 * PUT /api/teams/[id]/members/[userId]
 * Update a team member's role
 *
 * Request Body:
 * - role: 'member' | 'leader' | 'viewer' (required)
 *
 * Response:
 * - 200: Member role updated successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin or team leader)
 * - 404: Team or member not found
 * - 500: Internal server error
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
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

    const { id: teamId, userId } = await params;

    // Check management permissions (Admin or Team Leader)
    const teamRole = await getTeamRole(session.user.id, teamId);
    const canManage = canManageTeamMembers(session.user.role, teamRole);

    if (!canManage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "Only admins and team leaders can update team member roles",
          },
        },
        { status: 403 },
      );
    }

    // Check if team exists
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

    // Check if member exists in this team
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
      )
      .limit(1);

    if (!existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Member not found in this team",
          },
        },
        { status: 404 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTeamMemberSchema.parse(body);

    // Update member role
    const [updatedMember] = await db
      .update(teamMembers)
      .set({
        role: validatedData.role,
      })
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMember,
    });
  } catch (error) {
    console.error(`PUT /api/teams/[id]/members/[userId] error:`, error);

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
          message: "Failed to update team member role",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/teams/[id]/members/[userId]
 * Remove a member from a team
 *
 * Response:
 * - 200: Member removed successfully
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Team or member not found
 * - 500: Internal server error
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
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

    const { id: teamId, userId } = await params;

    // Check management permissions (Admin or Team Leader)
    const teamRole = await getTeamRole(session.user.id, teamId);
    const canManage = canManageTeamMembers(session.user.role, teamRole);

    if (!canManage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only admins and team leaders can remove team members",
          },
        },
        { status: 403 },
      );
    }

    // Check if team exists
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

    // Check if member exists in this team
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
      )
      .limit(1);

    if (!existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Member not found in this team",
          },
        },
        { status: 404 },
      );
    }

    // Remove member from team
    await db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
      );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(`DELETE /api/teams/[id]/members/[userId] error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to remove team member",
        },
      },
      { status: 500 },
    );
  }
}
