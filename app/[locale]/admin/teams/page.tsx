import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type CreateTeamData,
  createTeam,
  deleteTeam,
  getTeams,
  type UpdateTeamData,
  updateTeam,
} from "@/lib/api/teams";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { TeamsClient } from "./teams-client";

export default async function TeamsPage() {
  // Permission check: Only admins can access team management
  const session = await getAuthenticatedSession();

  if (!session || session.user.role !== "admin") {
    redirect("/work-logs");
  }

  // Server-side data fetching
  const teams = await getTeams(false);

  // Server Actions wrapped in async functions
  const handleCreateTeam = async (data: CreateTeamData) => {
    "use server";
    await createTeam(data);
    revalidatePath("/[locale]/admin/teams");
  };

  const handleUpdateTeam = async (id: string, data: UpdateTeamData) => {
    "use server";
    await updateTeam(id, data);
    revalidatePath("/[locale]/admin/teams");
  };

  const handleDeleteTeam = async (id: string) => {
    "use server";
    await deleteTeam(id);
    revalidatePath("/[locale]/admin/teams");
  };

  return (
    <TeamsClient
      initialTeams={teams}
      onCreateTeam={handleCreateTeam}
      onUpdateTeam={handleUpdateTeam}
      onDeleteTeam={handleDeleteTeam}
    />
  );
}
