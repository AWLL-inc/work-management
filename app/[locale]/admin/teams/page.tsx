import { revalidatePath } from "next/cache";
import { createTeam, deleteTeam, getTeams, updateTeam } from "@/lib/api/teams";
import { TeamsClient } from "./teams-client";

export default async function TeamsPage() {
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
