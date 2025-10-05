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
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";
import { createWorkLogColumns } from "./work-log-columns";
import { WorkLogFormDialog } from "./work-log-form-dialog";

interface WorkLogTableProps {
  workLogs: WorkLog[];
  projects: Project[];
  categories: WorkCategory[];
  onCreateWorkLog: (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => Promise<void>;
  onUpdateWorkLog: (
    id: string,
    data: {
      date?: string;
      hours?: string;
      projectId?: string;
      categoryId?: string;
      details?: string | null;
    },
  ) => Promise<void>;
  onDeleteWorkLog: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function WorkLogTable({
  workLogs,
  projects,
  categories,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  isLoading,
}: WorkLogTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
    setFormOpen(true);
  };

  const handleDelete = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (selectedWorkLog) {
        await onUpdateWorkLog(selectedWorkLog.id, data);
      } else {
        await onCreateWorkLog(data);
      }
      setFormOpen(false);
      setSelectedWorkLog(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkLog) return;

    setIsSubmitting(true);
    try {
      await onDeleteWorkLog(selectedWorkLog.id);
      setDeleteDialogOpen(false);
      setSelectedWorkLog(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = createWorkLogColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    projects,
    categories,
  });

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Work Logs</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your daily work hours
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setSelectedWorkLog(null);
              setFormOpen(true);
            }}
          >
            Add Work Log
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <DataTable columns={columns} data={workLogs} searchKey="details" />
      )}

      <WorkLogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        workLog={selectedWorkLog}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        projects={projects}
        categories={categories}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this work log entry?
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
