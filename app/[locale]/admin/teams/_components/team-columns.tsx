"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { TeamWithMembers, UserTeamMembership } from "@/lib/api/teams";

interface TeamColumnsOptions {
  userMemberships: UserTeamMembership[];
  onEdit: (team: TeamWithMembers) => void;
  onDelete: (team: TeamWithMembers) => void;
}

export function createTeamColumns({
  userMemberships,
  onEdit,
  onDelete,
}: TeamColumnsOptions): ColumnDef<TeamWithMembers>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Team Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("name")}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.original.description || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "memberCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Members
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="text-sm">{row.original.memberCount || 0}</div>;
      },
    },
    {
      id: "yourRole",
      header: "Your Role",
      cell: ({ row }) => {
        const teamId = row.original.id;
        const membership = userMemberships.find((m) => m.teamId === teamId);

        if (!membership) {
          return <div className="text-sm text-muted-foreground">-</div>;
        }

        const roleConfig = {
          leader: {
            label: "Leader",
            variant: "default" as const,
          },
          member: {
            label: "Member",
            variant: "secondary" as const,
          },
          viewer: {
            label: "Viewer",
            variant: "outline" as const,
          },
        };

        const config = roleConfig[membership.role];

        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        return (
          <Badge variant={row.original.isActive ? "success" : "secondary"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const team = row.original;

        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild aria-label="View">
              <Link
                href={`/admin/teams/${team.id}`}
                aria-label={`View ${team.name}`}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View {team.name}</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(team);
              }}
              aria-label={`Edit ${team.name}`}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit {team.name}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(team);
              }}
              aria-label={`Delete ${team.name}`}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete {team.name}</span>
            </Button>
          </div>
        );
      },
    },
  ];
}
