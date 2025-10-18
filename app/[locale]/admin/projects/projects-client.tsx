"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ProjectTable } from "@/components/features/admin/projects/project-table";
import type { Project } from "@/drizzle/schema";

interface ProjectsClientProps {
  initialProjects: Project[];
  onCreateProject: (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => Promise<void>;
  onUpdateProject: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    },
  ) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function ProjectsClient({
  initialProjects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectsClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    try {
      setIsLoading(true);
      await onCreateProject(data);
      toast.success("Project created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project",
      );
      throw error;
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      await onUpdateProject(id, data);
      toast.success("Project updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update project",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      setIsLoading(true);
      await onDeleteProject(id);
      toast.success("Project deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <ProjectTable
        projects={initialProjects}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        isLoading={isLoading}
      />
    </div>
  );
}
