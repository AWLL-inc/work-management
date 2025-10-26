import { eq } from "drizzle-orm";
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

  // Get all team IDs for user1
  const user1Teams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId1));

  if (user1Teams.length === 0) return false;

  const teamIds = user1Teams.map((t) => t.teamId);

  // Check if user2 belongs to any of those teams
  const user2Teams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId2));

  const commonTeams = user2Teams.filter((t) => teamIds.includes(t.teamId));

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
 * Check if a user can edit a work log
 *
 * Permission rules:
 * 1. Admin can edit all work logs
 * 2. User can edit their own work logs
 * 3. Team leaders cannot edit other members' work logs (Phase 1)
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

  // 3. Phase 1: No other editing permissions
  // TODO: Phase 2 - Add team leader editing permissions
  return false;
}
