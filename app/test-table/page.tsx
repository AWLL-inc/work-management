"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const sampleData: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
  {
    id: "2",
    name: "Manager User",
    email: "manager@example.com",
    role: "manager",
  },
  {
    id: "3",
    name: "Regular User",
    email: "user@example.com",
    role: "user",
  },
  {
    id: "4",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
  },
  {
    id: "5",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "manager",
  },
];

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            alert(`Edit user: ${user.name}`);
          }}
        >
          Edit
        </Button>
      );
    },
  },
];

export default function TestTablePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Data Table Test Page</h1>
      <p className="text-gray-600 mb-4">
        This is a test page to verify shadcn/ui + TanStack Table integration.
      </p>
      <DataTable
        columns={columns}
        data={sampleData}
        searchKey="name"
        onRowClick={(user) => {
          console.log("Row clicked:", user);
        }}
      />
    </div>
  );
}
