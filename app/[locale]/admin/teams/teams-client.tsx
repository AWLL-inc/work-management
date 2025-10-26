"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TeamTable } from "@/components/features/admin/teams/team-table";
import type { TeamWithMembers } from "@/lib/api/teams";

interface TeamsClientProps {
  initialTeams: TeamWithMembers[];
  onCreateTeam: (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => Promise<void>;
  onUpdateTeam: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
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
    try {
      setIsLoading(true);
      await onCreateTeam(data);
      toast.success("Team created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create team",
      );
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
    try {
      setIsLoading(true);
      await onUpdateTeam(id, data);
      toast.success("Team updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update team",
      );
      console.error("Failed to update team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      setIsLoading(true);
      await onDeleteTeam(id);
      toast.success("Team deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team",
      );
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
