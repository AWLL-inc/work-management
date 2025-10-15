"use client";

import { toast } from "sonner";
import useSWR from "swr";
import { ProjectTable } from "@/components/features/admin/projects/project-table";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "@/lib/api/projects";

export default function ProjectsPage() {
  const {
    data: projects,
    isLoading,
    mutate,
  } = useSWR("/api/projects", () => getProjects(false), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    try {
      await createProject({
        name: data.name,
        description: data.description || null,
        isActive: data.isActive,
      });
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project",
      );
      throw error;
    }
  };

  const handleUpdateProject = async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) => {
    try {
      await updateProject(id, data);
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update project",
      );
      throw error;
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
      throw error;
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <ProjectTable
        projects={projects || []}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        isLoading={isLoading}
      />
    </div>
  );
}
