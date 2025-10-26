import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTeam, deleteTeam, getTeams, updateTeam } from "@/lib/api/teams";
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
  const handleCreateTeam = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    "use server";
    await createTeam({
      name: data.name,
      description: data.description || null,
      isActive: data.isActive,
    });
    revalidatePath("/[locale]/admin/teams");
  };

  const handleUpdateTeam = async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) => {
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
