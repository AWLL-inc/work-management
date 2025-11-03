"use client";

import type { ColDef, GridReadyEvent, ICellRendererParams } from "ag-grid-community";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { EnhancedAGGrid } from "@/components/data-table/enhanced/enhanced-ag-grid";
import { Badge } from "@/components/ui/badge";
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
import { ProjectFormDialog } from "./project-form-dialog";

interface EnhancedProjectTableProps {
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

export function EnhancedProjectTable({
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  isLoading,
}: EnhancedProjectTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);

  // Actions cell renderer
  const ActionsCellRenderer = useCallback(
    (params: ICellRendererParams<Project>) => {
      const project = params.data;
      if (!project) return null;

      return (
        <div className="flex h-full items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProject(project);
              setFormOpen(true);
            }}
            className="h-7 px-3 text-xs"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProject(project);
              setDeleteDialogOpen(true);
            }}
            className="h-7 px-3 text-xs text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      );
    },
    [],
  );

  // Status cell renderer
  const StatusCellRenderer = useCallback(
    (params: ICellRendererParams<Project>) => {
      const isActive = params.value as boolean;
      return (
        <div className="flex h-full items-center">
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      );
    },
    [],
  );

  // Column definitions
  const columnDefs: ColDef<Project>[] = useMemo(
    () => [
      {
        headerName: "Project Name",
        field: "name",
        flex: 1,
        minWidth: 200,
        sortable: true,
        filter: true,
      },
      {
        headerName: "Description",
        field: "description",
        flex: 2,
        minWidth: 300,
        sortable: true,
        filter: true,
        valueFormatter: (params) => params.value || "-",
      },
      {
        headerName: "Status",
        field: "isActive",
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: "Created At",
        field: "createdAt",
        width: 150,
        sortable: true,
        filter: "agDateColumnFilter",
        valueFormatter: (params) => {
          if (!params.value) return "";
          return new Date(params.value).toLocaleDateString();
        },
      },
      {
        headerName: "Updated At",
        field: "updatedAt",
        width: 150,
        sortable: true,
        filter: "agDateColumnFilter",
        valueFormatter: (params) => {
          if (!params.value) return "";
          return new Date(params.value).toLocaleDateString();
        },
      },
      {
        headerName: "Actions",
        cellRenderer: ActionsCellRenderer,
        width: 150,
        sortable: false,
        filter: false,
        pinned: "right",
        cellClass: "actions-cell",
      },
    ],
    [ActionsCellRenderer, StatusCellRenderer],
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
    }),
    [],
  );

  const handleFormSubmit = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (selectedProject) {
        await onUpdateProject(selectedProject.id, data);
        toast.success("Project updated successfully");
      } else {
        await onCreateProject(data);
        toast.success("Project created successfully");
      }
      setFormOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error("Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      await onDeleteProject(selectedProject.id);
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage project master data with enhanced AG Grid
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

      <div className="h-[600px]">
        <EnhancedAGGrid<Project>
          rowData={projects}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          enableToolbar={false}
          enableUndoRedo={false}
          batchEditingEnabled={false}
          enableQuickFilter={true}
          enableFloatingFilter={true}
          enableFilterToolPanel={true}
          gridOptions={{
            rowSelection: "single",
            suppressRowClickSelection: true,
          }}
        />
      </div>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedProject(null);
          }
        }}
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
