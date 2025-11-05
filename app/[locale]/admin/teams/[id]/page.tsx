import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
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

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Authenticate user - only admins and team members can access
  const session = await getAuthenticatedSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { id: teamId } = await params;

  try {
    // Fetch team details with members and available users
    const [team, users] = await Promise.all([getTeam(teamId), getUsers()]);

    if (!team) {
      notFound();
    }

    // Server Actions for member management
    const handleAddMember = async (data: {
      userId: string;
      role?: string;
    }): Promise<ServerActionResult> => {
      "use server";
      return wrapServerAction(async () => {
        await addTeamMember(teamId, data);
        revalidatePath(`/[locale]/admin/teams/${teamId}`);
      });
    };

    const handleRemoveMember = async (
      userId: string,
    ): Promise<ServerActionResult> => {
      "use server";
      return wrapServerAction(async () => {
        await removeTeamMember(teamId, userId);
        revalidatePath(`/[locale]/admin/teams/${teamId}`);
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
  } catch (error) {
    console.error("Failed to fetch team details:", error);
    notFound();
  }
}
