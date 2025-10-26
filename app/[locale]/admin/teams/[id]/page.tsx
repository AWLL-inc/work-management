import { revalidatePath } from "next/cache";
import {
  addTeamMember,
  getTeam,
  getUsers,
  removeTeamMember,
} from "@/lib/api/teams";
import { TeamDetailClient } from "./team-detail-client";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;

  // Server-side data fetching
  const [team, users] = await Promise.all([getTeam(id), getUsers()]);

  // Server Actions
  const handleAddMember = async (data: { userId: string; role?: string }) => {
    "use server";
    await addTeamMember(id, data);
    revalidatePath(`/[locale]/admin/teams/${id}`);
  };

  const handleRemoveMember = async (userId: string) => {
    "use server";
    await removeTeamMember(id, userId);
    revalidatePath(`/[locale]/admin/teams/${id}`);
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
