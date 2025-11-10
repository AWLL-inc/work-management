import { revalidatePath } from "next/cache";
import {
  createUser,
  getAllUsers,
  updateUser,
} from "@/lib/db/repositories/user-repository";
import { generateSecurePassword, hashPassword } from "@/lib/utils/password";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  // Server-side data fetching - directly from repository
  const users = await getAllUsers({ activeOnly: false });

  // Server Actions wrapped in async functions
  const handleCreateUser = async (data: {
    name: string;
    email: string;
    role: string;
  }) => {
    "use server";

    console.log("[Server Action] handleCreateUser called with:", data);

    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword(12);
    console.log("[Server Action] Generated password:", temporaryPassword);
    const passwordHash = await hashPassword(temporaryPassword);

    await createUser({
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
      passwordResetRequired: true, // Force password change on first login
    });

    // Don't revalidate here - let the client handle it after showing the password
    // revalidatePath("/[locale]/admin/users");

    // Return the temporary password to display to the admin
    const result = { temporaryPassword };
    console.log("[Server Action] Returning:", result);
    return result;
  };

  const handleUpdateUser = async (
    id: string,
    data: {
      name: string;
      email: string;
      role: string;
    },
  ) => {
    "use server";

    const result = await updateUser(id, {
      name: data.name,
      email: data.email,
      role: data.role,
    });

    if (!result) {
      throw new Error("Failed to update user");
    }

    revalidatePath("/[locale]/admin/users");

    // No password returned for updates
    return {};
  };

  const handleDeleteUser = async (id: string) => {
    "use server";

    // Soft delete by setting role to 'inactive'
    const result = await updateUser(id, {
      role: "inactive",
    });

    if (!result) {
      throw new Error("Failed to delete user");
    }

    revalidatePath("/[locale]/admin/users");
  };

  return (
    <UsersClient
      initialUsers={users}
      onCreateUser={handleCreateUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
    />
  );
}
