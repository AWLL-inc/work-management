import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { teamMembers, teams, users } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { canManageTeamMembers, getTeamRole } from "@/lib/permissions";
import { addTeamMemberSchema } from "@/lib/validations";

/**
 * POST /api/teams/[id]/members
 * Add a member to a team
 *
 * Request Body:
 * - userId: string (required, UUID)
 * - role: 'member' | 'leader' | 'viewer' (optional, default: 'member')
 *
 * Response:
 * - 201: Member added successfully
 * - 400: Validation error or member already exists
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Team or user not found
 * - 500: Internal server error
 */
export async function POST(
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

    const { id: teamId } = await params;

    // Check management permissions (Admin or Team Leader)
    const teamRole = await getTeamRole(session.user.id, teamId);
    const canManage = canManageTeamMembers(session.user.role, teamRole);

    if (!canManage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only admins and team leaders can add team members",
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = addTeamMemberSchema.parse(body);

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedData.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 },
      );
    }

    // Check if user is already a member of this team
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, validatedData.userId),
        ),
      )
      .limit(1);

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_MEMBER",
            message: "User is already a member of this team",
          },
        },
        { status: 400 },
      );
    }

    // Add member to team
    const [newMember] = await db
      .insert(teamMembers)
      .values({
        teamId,
        userId: validatedData.userId,
        role: validatedData.role,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newMember,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(`POST /api/teams/[id]/members error:`, error);

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
          message: "Failed to add team member",
        },
      },
      { status: 500 },
    );
  }
}
