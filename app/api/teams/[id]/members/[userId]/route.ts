import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { teamMembers, teams } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

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

    // Check if user is admin
    // TODO: Phase 2 - Allow team leaders to remove members
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only admins can remove team members",
          },
        },
        { status: 403 },
      );
    }

    const { id: teamId, userId } = await params;

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
