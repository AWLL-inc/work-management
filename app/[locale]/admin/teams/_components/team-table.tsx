"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/spinner";
import type { TeamWithMembers, UserTeamMembership } from "@/lib/api/teams";
import { createTeamColumns } from "./team-columns";
import { TeamFormDialog } from "./team-form-dialog";

interface TeamTableProps {
  teams: TeamWithMembers[];
  userMemberships: UserTeamMembership[];
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
  isLoading: boolean;
}

export function TeamTable({
  teams,
  userMemberships,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  isLoading,
}: TeamTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(
    null,
  );

  const handleEdit = (team: TeamWithMembers) => {
    setSelectedTeam(team);
    setFormOpen(true);
  };

  const handleDelete = (team: TeamWithMembers) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    if (selectedTeam) {
      await onUpdateTeam(selectedTeam.id, data);
    } else {
      await onCreateTeam(data);
    }
    setFormOpen(false);
    setSelectedTeam(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeam) return;

    await onDeleteTeam(selectedTeam.id);
    setDeleteDialogOpen(false);
    setSelectedTeam(null);
  };

  const columns = createTeamColumns({
    userMemberships,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground mt-1">
              Manage team organization and members
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setSelectedTeam(null);
              setFormOpen(true);
            }}
          >
            Add Team
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading teams..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create your first team to organize members and manage work logs."
          action={{
            label: "Create Team",
            onClick: () => {
              setSelectedTeam(null);
              setFormOpen(true);
            },
          }}
        />
      ) : (
        <DataTable columns={columns} data={teams} searchKey="name" />
      )}

      <TeamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        team={selectedTeam}
        onSubmit={handleFormSubmit}
        isSubmitting={isLoading}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTeam?.name}"? This will
              mark it as inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
