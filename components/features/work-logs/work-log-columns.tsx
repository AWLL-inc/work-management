"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { WorkLog, Project, WorkCategory } from "@/drizzle/schema";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";

interface WorkLogWithRelations extends WorkLog {
  project?: Project;
  category?: WorkCategory;
}

interface WorkLogColumnsOptions {
  onEdit: (workLog: WorkLog) => void;
  onDelete: (workLog: WorkLog) => void;
  projects: Project[];
  categories: WorkCategory[];
}

export function createWorkLogColumns({
  onEdit,
  onDelete,
  projects,
  categories,
}: WorkLogColumnsOptions): ColumnDef<WorkLog>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("date") as Date;
        return <div className="text-sm">{new Date(date).toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "hours",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Hours
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const hours = row.getValue("hours") as string;
        return <div className="text-sm">{hours}h</div>;
      },
    },
    {
      accessorKey: "projectId",
      header: "Project",
      cell: ({ row }) => {
        const projectId = row.getValue("projectId") as string;
        const project = projects.find((p) => p.id === projectId);
        return <div className="text-sm">{project?.name || "-"}</div>;
      },
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const categoryId = row.getValue("categoryId") as string;
        const category = categories.find((c) => c.id === categoryId);
        return <div className="text-sm">{category?.name || "-"}</div>;
      },
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const details = row.getValue("details") as string | null;
        // Strip HTML tags for table display
        const plainText = details
          ? details.replace(/<[^>]*>/g, "").trim()
          : "";
        return (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {plainText || "-"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const workLog = row.original;

        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(workLog);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workLog);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
