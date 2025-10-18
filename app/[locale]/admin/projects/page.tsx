import { revalidatePath } from "next/cache";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "@/lib/api/projects";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  // Server-side data fetching
  const projects = await getProjects(false);

  // Server Actions wrapped in async functions
  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    "use server";
    await createProject({
      name: data.name,
      description: data.description || null,
      isActive: data.isActive,
    });
    revalidatePath("/[locale]/admin/projects");
  };

  const handleUpdateProject = async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) => {
    "use server";
    await updateProject(id, data);
    revalidatePath("/[locale]/admin/projects");
  };

  const handleDeleteProject = async (id: string) => {
    "use server";
    await deleteProject(id);
    revalidatePath("/[locale]/admin/projects");
  };

  return (
    <ProjectsClient
      initialProjects={projects}
      onCreateProject={handleCreateProject}
      onUpdateProject={handleUpdateProject}
      onDeleteProject={handleDeleteProject}
    />
  );
}
