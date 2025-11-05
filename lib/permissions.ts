import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { teamMembers } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";

/**
 * Check if two users are teammates (belong to the same team)
 *
 * @param userId1 - First user's ID
 * @param userId2 - Second user's ID
 * @returns True if users are in the same team, false otherwise
 */
export async function checkIfTeammates(
  userId1: string,
  userId2: string,
): Promise<boolean> {
  if (userId1 === userId2) return true;

  // Find common teams with a single query using self-join
  const tm1 = teamMembers;
  const tm2 = alias(teamMembers, "tm2");

  const commonTeams = await db
    .select({ teamId: tm1.teamId })
    .from(tm1)
    .innerJoin(tm2, eq(tm1.teamId, tm2.teamId))
    .where(and(eq(tm1.userId, userId1), eq(tm2.userId, userId2)))
    .limit(1);

  return commonTeams.length > 0;
}

/**
 * Check if a user can view a work log
 *
 * Permission rules:
 * 1. Admin can view all work logs
 * 2. User can view their own work logs
 * 3. User can view work logs of their teammates
 *
 * @param viewerUserId - ID of the user who wants to view
 * @param targetUserId - ID of the user whose work log is being viewed
 * @param viewerRole - Role of the viewer ('admin', 'manager', 'user')
 * @returns True if viewer can view the work log, false otherwise
 */
export async function canViewWorkLog(
  viewerUserId: string,
  targetUserId: string,
  viewerRole: string,
): Promise<boolean> {
  // 1. Admin can view all
  if (viewerRole === "admin") return true;

  // 2. User can view their own
  if (viewerUserId === targetUserId) return true;

  // 3. Check if users are teammates
  const isTeammate = await checkIfTeammates(viewerUserId, targetUserId);
  if (isTeammate) return true;

  // 4. Otherwise, deny access
  return false;
}

/**
 * Get user's role in a team
 *
 * @param userId - User's ID
 * @param teamId - Team's ID
 * @returns Team role ('leader', 'member', 'viewer') or null if not a member
 */
export async function getTeamRole(
  userId: string,
  teamId: string,
): Promise<"leader" | "member" | "viewer" | null> {
  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1);

  if (!membership) return null;

  return membership.role as "leader" | "member" | "viewer";
}

/**
 * Get user's role for a work log owner (finds common team and returns role)
 *
 * @param userId - User's ID
 * @param workLogOwnerId - Work log owner's ID
 * @returns Team role ('leader', 'member', 'viewer') or null if not teammates
 */
export async function getTeamRoleForUser(
  userId: string,
  workLogOwnerId: string,
): Promise<"leader" | "member" | "viewer" | null> {
  if (userId === workLogOwnerId) return null;

  // Find common team and get user's role
  const tm1 = teamMembers;
  const tm2 = alias(teamMembers, "tm2");

  const [result] = await db
    .select({ role: tm1.role })
    .from(tm1)
    .innerJoin(tm2, eq(tm1.teamId, tm2.teamId))
    .where(and(eq(tm1.userId, userId), eq(tm2.userId, workLogOwnerId)))
    .limit(1);

  if (!result) return null;

  return result.role as "leader" | "member" | "viewer";
}

/**
 * Check if a user can edit a team member's work log
 *
 * Permission rules:
 * 1. Admin can edit all work logs
 * 2. User can edit their own work logs (except viewers)
 * 3. Team Leader can edit same team members' work logs
 *
 * @param editorUserId - ID of the user who wants to edit
 * @param targetUserId - ID of the user whose work log is being edited
 * @param editorRole - Role of the editor ('admin', 'manager', 'user')
 * @param teamRole - Editor's role in the team ('leader', 'member', 'viewer') or null
 * @param isSameTeam - Whether editor and target are in the same team
 * @returns True if editor can edit the work log, false otherwise
 */
export function canEditTeamMemberWorkLog(
  editorUserId: string,
  targetUserId: string,
  editorRole: string,
  teamRole: "leader" | "member" | "viewer" | null,
  isSameTeam: boolean,
): boolean {
  // 1. Admin can edit all
  if (editorRole === "admin") return true;

  // 2. User can edit their own (except viewers)
  if (editorUserId === targetUserId && teamRole !== "viewer") return true;

  // 3. Team Leader can edit same team members' work logs
  if (teamRole === "leader" && isSameTeam) return true;

  // 4. Otherwise, deny access
  return false;
}

/**
 * Check if a user can manage team members
 *
 * Permission rules:
 * 1. Admin can manage all teams
 * 2. Team Leader can manage their own team members
 *
 * @param userRole - User's role ('admin', 'manager', 'user')
 * @param teamRole - User's role in the team ('leader', 'member', 'viewer') or null
 * @returns True if user can manage team members, false otherwise
 */
export function canManageTeamMembers(
  userRole: string,
  teamRole: "leader" | "member" | "viewer" | null,
): boolean {
  // 1. Admin can manage all teams
  if (userRole === "admin") return true;

  // 2. Team Leader can manage their own team
  if (teamRole === "leader") return true;

  // 3. Otherwise, deny access
  return false;
}

/**
 * Check if a user can edit a work log
 *
 * Permission rules:
 * 1. Admin can edit all work logs
 * 2. User can edit their own work logs
 * 3. Team leaders can edit other members' work logs (if in same team)
 *
 * @param editorUserId - ID of the user who wants to edit
 * @param targetUserId - ID of the user whose work log is being edited
 * @param editorRole - Role of the editor ('admin', 'manager', 'user')
 * @returns True if editor can edit the work log, false otherwise
 */
export async function canEditWorkLog(
  editorUserId: string,
  targetUserId: string,
  editorRole: string,
): Promise<boolean> {
  // 1. Admin can edit all
  if (editorRole === "admin") return true;

  // 2. User can edit their own
  if (editorUserId === targetUserId) return true;

  // 3. Check if user is a team leader and target is in the same team
  const teamRole = await getTeamRoleForUser(editorUserId, targetUserId);
  const isSameTeam = await checkIfTeammates(editorUserId, targetUserId);

  return canEditTeamMemberWorkLog(
    editorUserId,
    targetUserId,
    editorRole,
    teamRole,
    isSameTeam,
  );
}
