"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";

const workLogFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  hours: z
    .string()
    .min(1, "Hours is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Hours must be a positive number")
    .refine(
      (val) => Number.parseFloat(val) > 0,
      "Hours must be greater than 0",
    ),
  projectId: z.string().min(1, "Project is required"),
  categoryId: z.string().min(1, "Category is required"),
  details: z.string().optional(),
});

type WorkLogFormValues = z.infer<typeof workLogFormSchema>;

interface WorkLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workLog: WorkLog | null;
  onSubmit: (data: WorkLogFormValues) => Promise<void>;
  isSubmitting: boolean;
  projects: Project[];
  categories: WorkCategory[];
}

export function WorkLogFormDialog({
  open,
  onOpenChange,
  workLog,
  onSubmit,
  isSubmitting,
  projects,
  categories,
}: WorkLogFormDialogProps) {
  const form = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      hours: "",
      projectId: "",
      categoryId: "",
      details: "",
    },
  });

  useEffect(() => {
    if (workLog) {
      form.reset({
        date: new Date(workLog.date).toISOString().split("T")[0],
        hours: workLog.hours,
        projectId: workLog.projectId,
        categoryId: workLog.categoryId,
        details: workLog.details || "",
      });
    } else {
      form.reset({
        date: new Date().toISOString().split("T")[0],
        hours: "",
        projectId: "",
        categoryId: "",
        details: "",
      });
    }
  }, [workLog, form]);

  const handleSubmit = async (data: WorkLogFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {workLog ? "Edit Work Log" : "Create New Work Log"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., 8 or 7.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects
                        .filter((p) => p.isActive)
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories
                        .filter((c) => c.isActive)
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details (Optional)</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter work details with rich formatting..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
