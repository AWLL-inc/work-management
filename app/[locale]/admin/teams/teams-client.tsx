"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { TeamWithMembers } from "@/lib/api/teams";
import type { ServerActionResult } from "@/lib/server-actions";
import { TeamTable } from "./_components/team-table";

interface TeamsClientProps {
  initialTeams: TeamWithMembers[];
  onCreateTeam: (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => Promise<ServerActionResult>;
  onUpdateTeam: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) => Promise<ServerActionResult>;
  onDeleteTeam: (id: string) => Promise<ServerActionResult>;
}

export function TeamsClient({
  initialTeams,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
}: TeamsClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTeam = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    setIsLoading(true);
    try {
      const result = await onCreateTeam(data);
      if (result.success) {
        toast.success("Team created successfully");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to create team");
      console.error("Failed to create team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeam = async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) => {
    setIsLoading(true);
    try {
      const result = await onUpdateTeam(id, data);
      if (result.success) {
        toast.success("Team updated successfully");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update team");
      console.error("Failed to update team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    setIsLoading(true);
    try {
      const result = await onDeleteTeam(id);
      if (result.success) {
        toast.success("Team deleted successfully");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete team");
      console.error("Failed to delete team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <TeamTable
        teams={initialTeams}
        onCreateTeam={handleCreateTeam}
        onUpdateTeam={handleUpdateTeam}
        onDeleteTeam={handleDeleteTeam}
        isLoading={isLoading}
      />
    </div>
  );
}
