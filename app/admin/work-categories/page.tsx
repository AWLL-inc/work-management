"use client";

import { CategoryTable } from "@/components/features/admin/work-categories/category-table";
import useSWR from "swr";
import { toast } from "sonner";
import {
  getWorkCategories,
  createWorkCategory,
  updateWorkCategory,
  deleteWorkCategory,
} from "@/lib/api/work-categories";

export default function WorkCategoriesPage() {
  const {
    data: categories,
    isLoading,
    mutate,
  } = useSWR("/api/work-categories", () => getWorkCategories(false), {
    revalidateOnFocus: false,
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
      toast.success("Category created successfully");
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category"
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
    }
  ) => {
    try {
      await updateWorkCategory(id, data);
      toast.success("Category updated successfully");
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category"
      );
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteWorkCategory(id);
      toast.success("Category deleted successfully");
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
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
