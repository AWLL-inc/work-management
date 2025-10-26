import type { Team, TeamMember, User } from "@/drizzle/schema";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

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
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch teams");
  }

  const result: ApiResponse<TeamWithMembers[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to fetch teams");
  }

  return result.data;
}

/**
 * Fetch a team by ID with members
 */
export async function getTeam(id: string): Promise<TeamWithMembers> {
  const response = await fetch(`/api/teams/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch team");
  }

  const result: ApiResponse<TeamWithMembers> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to fetch team");
  }

  return result.data;
}

/**
 * Create a new team
 */
export async function createTeam(data: CreateTeamData): Promise<Team> {
  const response = await fetch("/api/teams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to create team");
  }

  const result: ApiResponse<Team> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to create team");
  }

  return result.data;
}

/**
 * Update a team
 */
export async function updateTeam(
  id: string,
  data: UpdateTeamData,
): Promise<Team> {
  const response = await fetch(`/api/teams/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to update team");
  }

  const result: ApiResponse<Team> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to update team");
  }

  return result.data;
}

/**
 * Delete a team (soft delete)
 */
export async function deleteTeam(id: string): Promise<void> {
  const response = await fetch(`/api/teams/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to delete team");
  }

  const result: ApiResponse<never> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to delete team");
  }
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  data: AddMemberData,
): Promise<TeamMember> {
  const response = await fetch(`/api/teams/${teamId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to add team member");
  }

  const result: ApiResponse<TeamMember> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to add team member");
  }

  return result.data;
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<void> {
  const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result: ApiResponse<never> = await response.json();
    throw new Error(result.error?.message || "Failed to remove team member");
  }

  const result: ApiResponse<never> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to remove team member");
  }
}

/**
 * Fetch all users for member selection
 */
export async function getUsers(): Promise<User[]> {
  const response = await fetch("/api/users");

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const result: ApiResponse<User[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to fetch users");
  }

  return result.data;
}
