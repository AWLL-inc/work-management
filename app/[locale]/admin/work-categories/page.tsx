"use client";

import { toast } from "sonner";
import useSWR from "swr";
import { CategoryTable } from "@/components/features/admin/work-categories/category-table";
import {
  createWorkCategory,
  deleteWorkCategory,
  getWorkCategories,
  updateWorkCategory,
} from "@/lib/api/work-categories";

export default function WorkCategoriesPage() {
  const {
    data: categories,
    isLoading,
    mutate,
  } = useSWR("/api/work-categories", () => getWorkCategories(false), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const handleCreateCategory = async (data: {
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
  }) => {
    try {
      await createWorkCategory({
        name: data.name,
        description: data.description || null,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      });
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category",
      );
      throw error;
    }
  };

  const handleUpdateCategory = async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) => {
    // Optimistic update: update UI immediately
    if (categories && data.displayOrder !== undefined) {
      const displayOrder = data.displayOrder;
      const updatedCategories = categories.map((cat) =>
        cat.id === id ? { ...cat, displayOrder } : cat,
      );
      mutate(updatedCategories, false);
    }

    try {
      await updateWorkCategory(id, data);
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category",
      );
      mutate(); // Revert on error
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteWorkCategory(id);
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      );
      throw error;
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <CategoryTable
        categories={categories || []}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        isLoading={isLoading}
      />
    </div>
  );
}
