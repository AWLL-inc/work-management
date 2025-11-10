"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/drizzle/schema";

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "manager", "user"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (data: UserFormValues) => Promise<{ temporaryPassword?: string }>;
  temporaryPassword: string | null;
  onPasswordClose: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  temporaryPassword,
  onPasswordClose,
}: UserFormDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Log when component renders
  console.log("[UserFormDialog] Rendering. State:", {
    temporaryPassword,
    isLoading,
    open,
    user: user?.id,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
    },
  });

  useEffect(() => {
    // Don't reset if we're showing a temporary password
    if (temporaryPassword) {
      return;
    }

    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email,
        role: user.role as "admin" | "manager" | "user",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        role: "user",
      });
    }
  }, [user, form, temporaryPassword]);

  const handleSubmit = async (data: UserFormValues) => {
    console.log("[UserFormDialog] handleSubmit called with:", data);
    setIsLoading(true);
    try {
      const result = await onSubmit(data);
      console.log("[UserFormDialog] Result from onSubmit:", result);
      console.log(
        "[UserFormDialog] result.temporaryPassword:",
        result.temporaryPassword,
      );
      // Password is now managed by parent, so we don't need to set it here
      // Just check if it's an update (no password) and close the dialog
      if (!result.temporaryPassword) {
        console.log("[UserFormDialog] No temporaryPassword, closing dialog");
        form.reset();
        onOpenChange(false);
      } else {
        console.log(
          "[UserFormDialog] Password was set by parent, staying open",
        );
      }
    } catch (error) {
      // Error is already handled by the parent component
      console.error("[UserFormDialog] Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      toast.success(t("admin.users.passwordCopied"));
    }
  };

  const handleClose = () => {
    const hadPassword = !!temporaryPassword;
    onPasswordClose(); // Clear password in parent
    form.reset();
    onOpenChange(false);

    // Refresh the page after showing password (to update the user list)
    if (hadPassword) {
      console.log("[UserFormDialog] Refreshing page after password display");
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user ? t("admin.users.editTitle") : t("admin.users.createTitle")}
          </DialogTitle>
        </DialogHeader>

        {temporaryPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <p className="mb-2 text-sm text-green-800 dark:text-green-200">
                {t("admin.users.passwordGenerated")}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={temporaryPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                {t("common.close")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.users.fields.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("admin.users.placeholders.name")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.users.fields.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("admin.users.placeholders.email")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.users.fields.role")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          {t("admin.users.roles.admin")}
                        </SelectItem>
                        <SelectItem value="manager">
                          {t("admin.users.roles.manager")}
                        </SelectItem>
                        <SelectItem value="user">
                          {t("admin.users.roles.user")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("common.loading") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
