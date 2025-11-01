import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addTeamMember,
  getTeam,
  getUsers,
  removeTeamMember,
} from "@/lib/api/teams";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  type ServerActionResult,
  wrapServerAction,
} from "@/lib/server-actions";
import { TeamDetailClient } from "./team-detail-client";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  // Permission check: Only admins can access team management
  const session = await getAuthenticatedSession();

  if (!session || session.user.role !== "admin") {
    redirect("/work-logs");
  }

  const { id } = await params;

  // Server-side data fetching
  const [team, users] = await Promise.all([getTeam(id), getUsers()]);

  // Server Actions with type-safe error handling
  const handleAddMember = async (data: {
    userId: string;
    role?: string;
  }): Promise<ServerActionResult> => {
    "use server";
    return wrapServerAction(async () => {
      await addTeamMember(id, data);
      revalidatePath(`/[locale]/admin/teams/${id}`);
    });
  };

  const handleRemoveMember = async (
    userId: string,
  ): Promise<ServerActionResult> => {
    "use server";
    return wrapServerAction(async () => {
      await removeTeamMember(id, userId);
      revalidatePath(`/[locale]/admin/teams/${id}`);
    });
  };

  return (
    <TeamDetailClient
      team={team}
      users={users}
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
    />
  );
}
