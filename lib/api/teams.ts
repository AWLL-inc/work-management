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

/**
 * Custom API error with HTTP status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Handle API response and extract error information
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode = `HTTP_${response.status}`;
    let errorDetails: unknown;

    try {
      const result: ApiResponse<never> = await response.json();
      if (result.error) {
        errorMessage = result.error.message;
        errorCode = result.error.code;
        errorDetails = result.error.details;
      }
    } catch {
      // If JSON parsing fails, use default error message
    }

    throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success || !result.data) {
    throw new ApiError(
      result.error?.message || "Request succeeded but returned no data",
      response.status,
      result.error?.code,
      result.error?.details,
    );
  }

  return result.data;
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
  return handleApiResponse<TeamWithMembers[]>(response);
}

/**
 * Fetch a team by ID with members
 */
export async function getTeam(id: string): Promise<TeamWithMembers> {
  const response = await fetch(`/api/teams/${id}`);
  return handleApiResponse<TeamWithMembers>(response);
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
  return handleApiResponse<Team>(response);
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
  return handleApiResponse<Team>(response);
}

/**
 * Delete a team (soft delete)
 */
export async function deleteTeam(id: string): Promise<void> {
  const response = await fetch(`/api/teams/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let errorMessage = `Failed to delete team (status ${response.status})`;
    let errorCode = `HTTP_${response.status}`;

    try {
      const result: ApiResponse<never> = await response.json();
      if (result.error) {
        errorMessage = result.error.message;
        errorCode = result.error.code;
      }
    } catch {
      // If JSON parsing fails, use default error message
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // 204 No Content - success without body
  if (response.status === 204) {
    return;
  }

  // Other success status codes with body
  try {
    const result: ApiResponse<never> = await response.json();

    if (!result.success) {
      throw new ApiError(
        result.error?.message || "Failed to delete team",
        response.status,
        result.error?.code,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Body parsing failed but response was ok - treat as success
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
  return handleApiResponse<TeamMember>(response);
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
    let errorMessage = `Failed to remove team member (status ${response.status})`;
    let errorCode = `HTTP_${response.status}`;

    try {
      const result: ApiResponse<never> = await response.json();
      if (result.error) {
        errorMessage = result.error.message;
        errorCode = result.error.code;
      }
    } catch {
      // If JSON parsing fails, use default error message
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // 204 No Content - success without body
  if (response.status === 204) {
    return;
  }

  // Other success status codes with body
  try {
    const result: ApiResponse<never> = await response.json();

    if (!result.success) {
      throw new ApiError(
        result.error?.message || "Failed to remove team member",
        response.status,
        result.error?.code,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Body parsing failed but response was ok - treat as success
  }
}

/**
 * Fetch all users for member selection
 */
export async function getUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  return handleApiResponse<User[]>(response);
}
