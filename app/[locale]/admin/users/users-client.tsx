"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { User } from "@/drizzle/schema";
import { UserTable } from "./_components/user-table";

interface UsersClientProps {
  initialUsers: User[];
  onCreateUser: (data: {
    name: string;
    email: string;
    role: string;
  }) => Promise<{ temporaryPassword?: string }>;
  onUpdateUser: (
    id: string,
    data: { name: string; email: string; role: string },
  ) => Promise<{ temporaryPassword?: string }>;
  onDeleteUser: (id: string) => Promise<void>;
}

export function UsersClient({
  initialUsers,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}: UsersClientProps) {
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async (data: {
    name: string;
    email: string;
    role: string;
  }): Promise<{ temporaryPassword?: string }> => {
    console.log("[UsersClient] handleCreate called with:", data);
    setIsPending(true);
    try {
      const result = await onCreateUser(data);
      console.log("[UsersClient] Result from onCreateUser:", result);
      toast.success("User created successfully");
      return result;
    } catch (error) {
      console.error("[UsersClient] Failed to create user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create user",
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdate = async (
    id: string,
    data: { name: string; email: string; role: string },
  ): Promise<{ temporaryPassword?: string }> => {
    setIsPending(true);
    try {
      const result = await onUpdateUser(id, data);
      toast.success("User updated successfully");
      return result;
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user",
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setIsPending(true);
    try {
      await onDeleteUser(id);
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user",
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return (
    <UserTable
      users={initialUsers}
      onCreateUser={handleCreate}
      onUpdateUser={handleUpdate}
      onDeleteUser={handleDelete}
      isLoading={isPending}
    />
  );
}
