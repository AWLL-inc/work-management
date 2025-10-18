"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CategoryTable } from "@/components/features/admin/work-categories/category-table";
import type { WorkCategory } from "@/drizzle/schema";

interface WorkCategoriesClientProps {
  initialCategories: WorkCategory[];
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
    },
  ) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function WorkCategoriesClient({
  initialCategories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: WorkCategoriesClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCategory = async (data: {
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
  }) => {
    try {
      setIsLoading(true);
      await onCreateCategory(data);
      toast.success("Category created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category",
      );
      throw error;
    } finally {
      setIsLoading(false);
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
    try {
      setIsLoading(true);
      await onUpdateCategory(id, data);
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setIsLoading(true);
      await onDeleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <CategoryTable
        categories={initialCategories}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        isLoading={isLoading}
      />
    </div>
  );
}
