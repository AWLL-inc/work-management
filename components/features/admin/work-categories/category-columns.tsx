"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { WorkCategory } from "@/drizzle/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CategoryColumnsProps {
  onEdit: (category: WorkCategory) => void;
  onDelete: (category: WorkCategory) => void;
  onMoveUp: (category: WorkCategory) => void;
  onMoveDown: (category: WorkCategory) => void;
}

export function createCategoryColumns({
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: CategoryColumnsProps): ColumnDef<WorkCategory>[] {
  return [
    {
      accessorKey: "displayOrder",
      header: "Order",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{row.original.displayOrder}</span>
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onMoveUp(row.original)}
            >
              ↑
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onMoveDown(row.original)}
            >
              ↓
            </Button>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(row.original)}
            disabled={!row.original.isActive}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
}
