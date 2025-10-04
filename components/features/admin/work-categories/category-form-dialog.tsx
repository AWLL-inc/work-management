"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { WorkCategory } from "@/drizzle/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: WorkCategory | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isSubmitting,
}: CategoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      });
    } else {
      reset({
        name: "",
        description: "",
        displayOrder: 0,
        isActive: true,
      });
    }
  }, [category, reset]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create New Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order *</Label>
            <Input
              id="displayOrder"
              type="number"
              {...register("displayOrder")}
              className={errors.displayOrder ? "border-red-500" : ""}
            />
            {errors.displayOrder && (
              <p className="text-sm text-red-500">
                {errors.displayOrder.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              {...register("isActive")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="font-normal">
              Active
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
