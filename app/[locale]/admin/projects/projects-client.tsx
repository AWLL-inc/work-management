"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/drizzle/schema";
import type { CreateProjectInput, UpdateProjectInput } from "@/types/project";
import { EnhancedProjectTable } from "./_components/enhanced-project-table";

interface ProjectsClientProps {
  initialProjects: Project[];
  onCreateProject: (data: CreateProjectInput) => Promise<void>;
  onUpdateProject: (id: string, data: UpdateProjectInput) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function ProjectsClient({
  initialProjects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectsClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async (data: CreateProjectInput) => {
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

  const handleUpdateProject = async (id: string, data: UpdateProjectInput) => {
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
      <EnhancedProjectTable
        projects={initialProjects}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        isLoading={isLoading}
      />
    </div>
  );
}
