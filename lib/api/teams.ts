import type { Team, TeamMember, User } from "@/drizzle/schema";
import { apiClient } from "./client";

export type { ApiResponse } from "./client";
// Re-export for backward compatibility
export { ApiError } from "./client";

export interface TeamWithMembers extends Team {
  memberCount?: number;
  members?: TeamMemberWithUser[];
}

export interface TeamMemberWithUser extends TeamMember {
  userName: string | null;
  userEmail: string;
}

export interface CreateTeamData {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateTeamData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface AddMemberData {
  userId: string;
  role?: string;
}

/**
 * Fetch all teams
 */
export async function getTeams(activeOnly = false): Promise<TeamWithMembers[]> {
  const url = `/api/teams${activeOnly ? "?active=true" : ""}`;
  return apiClient.get<TeamWithMembers[]>(url);
}

/**
 * Fetch a team by ID with members
 */
export async function getTeam(id: string): Promise<TeamWithMembers> {
  return apiClient.get<TeamWithMembers>(`/api/teams/${id}`);
}

/**
 * Create a new team
 */
export async function createTeam(data: CreateTeamData): Promise<Team> {
  return apiClient.post<Team>("/api/teams", data);
}

/**
 * Update a team
 */
export async function updateTeam(
  id: string,
  data: UpdateTeamData,
): Promise<Team> {
  return apiClient.put<Team>(`/api/teams/${id}`, data);
}

/**
 * Delete a team (soft delete)
 */
export async function deleteTeam(id: string): Promise<void> {
  return apiClient.delete(`/api/teams/${id}`);
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  data: AddMemberData,
): Promise<TeamMember> {
  return apiClient.post<TeamMember>(`/api/teams/${teamId}/members`, data);
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<void> {
  return apiClient.delete(`/api/teams/${teamId}/members/${userId}`);
}

/**
 * Fetch all users for member selection
 */
export async function getUsers(): Promise<User[]> {
  return apiClient.get<User[]>("/api/users");
}

/**
 * User's team membership information
 */
export interface UserTeamMembership {
  id: string;
  teamId: string;
  role: "leader" | "member" | "viewer";
  joinedAt: string; // ISO 8601 format
}

/**
 * Fetch current user's team memberships
 */
export async function getUserTeamMemberships(): Promise<UserTeamMembership[]> {
  return apiClient.get<UserTeamMembership[]>("/api/users/me/team-memberships");
}
