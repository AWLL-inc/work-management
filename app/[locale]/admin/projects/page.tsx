import { revalidatePath } from "next/cache";
import {
  createProject,
  deleteProject,
  getAllProjects,
  updateProject,
} from "@/lib/db/repositories/project-repository";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  // Server-side data fetching - directly from repository
  const projects = await getAllProjects({ activeOnly: false });

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
      isActive: data.isActive ?? true,
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
    const result = await updateProject(id, data);
    if (!result) {
      throw new Error("Failed to update project");
    }
    revalidatePath("/[locale]/admin/projects");
  };

  const handleDeleteProject = async (id: string) => {
    "use server";
    const result = await deleteProject(id);
    if (!result) {
      throw new Error("Failed to delete project");
    }
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
