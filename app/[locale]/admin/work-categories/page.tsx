import { revalidatePath } from "next/cache";
import {
  createWorkCategory,
  deleteWorkCategory,
  getWorkCategories,
  updateWorkCategory,
} from "@/lib/api/work-categories";
import { WorkCategoriesClient } from "./work-categories-client";

export default async function WorkCategoriesPage() {
  // Server-side data fetching
  const categories = await getWorkCategories(false);

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
      isActive: data.isActive,
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
    await updateWorkCategory(id, data);
    revalidatePath("/[locale]/admin/work-categories");
  };

  const handleDeleteCategory = async (id: string) => {
    "use server";
    await deleteWorkCategory(id);
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
