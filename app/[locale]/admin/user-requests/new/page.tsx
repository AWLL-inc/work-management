import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { getAllUsers } from "@/lib/db/repositories/user-repository";
import { UserRequestClient } from "./user-request-client";

export default async function NewUserRequestPage() {
  // Get authenticated session
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Only authenticated users can access this page
  // (no admin-only restriction as all users can submit requests)

  // Get all users to find approvers (admin and manager roles)
  const allUsers = await getAllUsers();

  // Convert to the format expected by the form
  const approvers = allUsers.map((user) => ({
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    role: user.role,
  }));

  // Get current logged-in user info
  const currentUser = {
    id: session.user.id,
    name: session.user.name || session.user.email || "Unknown",
    email: session.user.email || "unknown@example.com",
    role: session.user.role,
  };

  return <UserRequestClient approvers={approvers} currentUser={currentUser} />;
}
