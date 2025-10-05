"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/drizzle/schema";
import { createProjectColumns } from "./project-columns";
import { ProjectFormDialog } from "./project-form-dialog";

interface ProjectTableProps {
  projects: Project[];
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
  isLoading: boolean;
}

export function ProjectTable({
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  isLoading,
}: ProjectTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (selectedProject) {
        await onUpdateProject(selectedProject.id, data);
      } else {
        await onCreateProject(data);
      }
      setFormOpen(false);
      setSelectedProject(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      await onDeleteProject(selectedProject.id);
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = createProjectColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage project master data
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setSelectedProject(null);
              setFormOpen(true);
            }}
          >
            Add Project
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <DataTable columns={columns} data={projects} searchKey="name" />
      )}

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={selectedProject}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? This
              will mark it as inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
