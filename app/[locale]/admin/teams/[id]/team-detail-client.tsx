"use client";

import { ArrowLeft, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@/drizzle/schema";
import { Link } from "@/i18n/routing";
import type { TeamWithMembers } from "@/lib/api/teams";
import type { ServerActionResult } from "@/lib/server-actions";

interface TeamDetailClientProps {
  team: TeamWithMembers;
  users: User[];
  onAddMember: (data: {
    userId: string;
    role?: string;
  }) => Promise<ServerActionResult>;
  onRemoveMember: (userId: string) => Promise<ServerActionResult>;
}

export function TeamDetailClient({
  team,
  users,
  onAddMember,
  onRemoveMember,
}: TeamDetailClientProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out users who are already members
  const memberUserIds = new Set(team.members?.map((m) => m.userId) ?? []);
  const availableUsers = users.filter((u) => !memberUserIds.has(u.id));

  const handleAddMemberSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onAddMember({
        userId: selectedUserId,
        role: selectedRole,
      });
      if (result.success) {
        toast.success("Member added successfully");
        setAddMemberOpen(false);
        setSelectedUserId("");
        setSelectedRole("member");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to add member");
      console.error("Failed to add member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMemberClick = (userId: string) => {
    setMemberToRemove(userId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setIsSubmitting(true);
    try {
      const result = await onRemoveMember(memberToRemove);
      if (result.success) {
        toast.success("Member removed successfully");
        setDeleteDialogOpen(false);
        setMemberToRemove(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to remove member");
      console.error("Failed to remove member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberToRemoveData = team.members?.find(
    (m) => m.userId === memberToRemove,
  );

  return (
    <div className="px-4 sm:px-0 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
          <p className="text-muted-foreground mt-1">
            {team.description || "No description"}
          </p>
        </div>
        <Badge variant={team.isActive ? "success" : "secondary"}>
          {team.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Team Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({team.members?.length || 0})
          </CardTitle>
          <CardDescription>
            Manage members and their roles in this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setAddMemberOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          {team.members && team.members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.userName || "-"}
                    </TableCell>
                    <TableCell>{member.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMemberClick(member.userId)}
                        aria-label={`Remove ${member.userName || member.userEmail}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">
                          Remove {member.userName || member.userEmail}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={UserPlus}
              title="No team members"
              description="This team doesn't have any members yet. Click the button above to add your first member."
            />
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user and assign their role in the team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">User</div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Role</div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMemberSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{memberToRemoveData?.userName}" (
              {memberToRemoveData?.userEmail}) from this team?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
