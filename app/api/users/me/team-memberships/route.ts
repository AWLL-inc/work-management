import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { teamMembers } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

/**
 * GET /api/users/me/team-memberships
 * Get current user's team memberships
 *
 * Response:
 * - 200: Success with array of team memberships
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function GET() {
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

    // Get user's team memberships
    const memberships = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id));

    return NextResponse.json({
      success: true,
      data: memberships,
    });
  } catch (error) {
    console.error(`GET /api/users/me/team-memberships error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve team memberships",
        },
      },
      { status: 500 },
    );
  }
}
