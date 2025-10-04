"use client";

import { useState } from "react";
import type { WorkCategory } from "@/drizzle/schema";
import { DataTable } from "@/components/data-table/data-table";
import { createCategoryColumns } from "./category-columns";
import { CategoryFormDialog } from "./category-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface CategoryTableProps {
  categories: WorkCategory[];
  onCreateCategory: (data: {
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
  }) => Promise<void>;
  onUpdateCategory: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    }
  ) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function CategoryTable({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  isLoading,
}: CategoryTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WorkCategory | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (category: WorkCategory) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: WorkCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleMoveUp = async (category: WorkCategory) => {
    const currentIndex = categories.findIndex((c) => c.id === category.id);
    if (currentIndex <= 0) return;

    const prevCategory = categories[currentIndex - 1];
    if (!prevCategory) return;

    setIsSubmitting(true);
    try {
      await onUpdateCategory(category.id, {
        displayOrder: prevCategory.displayOrder,
      });
      await onUpdateCategory(prevCategory.id, {
        displayOrder: category.displayOrder,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveDown = async (category: WorkCategory) => {
    const currentIndex = categories.findIndex((c) => c.id === category.id);
    if (currentIndex >= categories.length - 1) return;

    const nextCategory = categories[currentIndex + 1];
    if (!nextCategory) return;

    setIsSubmitting(true);
    try {
      await onUpdateCategory(category.id, {
        displayOrder: nextCategory.displayOrder,
      });
      await onUpdateCategory(nextCategory.id, {
        displayOrder: category.displayOrder,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: {
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        await onUpdateCategory(selectedCategory.id, data);
      } else {
        await onCreateCategory(data);
      }
      setFormOpen(false);
      setSelectedCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      await onDeleteCategory(selectedCategory.id);
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = createCategoryColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onMoveUp: handleMoveUp,
    onMoveDown: handleMoveDown,
    categories,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Work Categories</h2>
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setFormOpen(true);
          }}
        >
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <DataTable columns={columns} data={categories} searchKey="name" />
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={selectedCategory}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This
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
