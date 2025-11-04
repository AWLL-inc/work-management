import { revalidatePath } from "next/cache";
import {
  createWorkCategory,
  deleteWorkCategory,
  getAllWorkCategories,
  updateWorkCategory,
} from "@/lib/db/repositories/work-category-repository";
import { WorkCategoriesClient } from "./work-categories-client";

export default async function WorkCategoriesPage() {
  // Server-side data fetching - directly from repository
  const categories = await getAllWorkCategories({ activeOnly: false });

  // Server Actions wrapped in async functions
  const handleCreateCategory = async (data: {
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
  }) => {
    "use server";
    await createWorkCategory({
      name: data.name,
      description: data.description || null,
      displayOrder: data.displayOrder,
      isActive: data.isActive ?? true,
    });
    revalidatePath("/[locale]/admin/work-categories");
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
    "use server";
    const result = await updateWorkCategory(id, data);
    if (!result) {
      throw new Error("Failed to update work category");
    }
    revalidatePath("/[locale]/admin/work-categories");
  };

  const handleDeleteCategory = async (id: string) => {
    "use server";
    const result = await deleteWorkCategory(id);
    if (!result) {
      throw new Error("Failed to delete work category");
    }
    revalidatePath("/[locale]/admin/work-categories");
  };

  return (
    <WorkCategoriesClient
      initialCategories={categories}
      onCreateCategory={handleCreateCategory}
      onUpdateCategory={handleUpdateCategory}
      onDeleteCategory={handleDeleteCategory}
    />
  );
}
