"use client";

import type {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
} from "ag-grid-community";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { EnhancedAGGrid } from "@/components/data-table/enhanced/enhanced-ag-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/drizzle/schema";
import { UserFormDialog } from "./user-form-dialog";

interface UserTableProps {
  users: User[];
  onCreateUser: (data: {
    name: string;
    email: string;
    role: string;
  }) => Promise<{ temporaryPassword?: string }>;
  onUpdateUser: (
    id: string,
    data: { name: string; email: string; role: string },
  ) => Promise<{ temporaryPassword?: string }>;
  onDeleteUser: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function UserTable({
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  isLoading,
}: UserTableProps) {
  const t = useTranslations();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  // Actions cell renderer
  const ActionsCellRenderer = useCallback(
    (params: ICellRendererParams<User>) => {
      const user = params.data;
      if (!user) return null;

      return (
        <div className="flex h-full items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
              setFormOpen(true);
            }}
            className="h-7 px-3 text-xs"
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
              setDeleteDialogOpen(true);
            }}
            className="h-7 px-3 text-xs text-destructive hover:text-destructive"
          >
            {t("common.delete")}
          </Button>
        </div>
      );
    },
    [t],
  );

  // Role cell renderer
  const RoleCellRenderer = useCallback(
    (params: ICellRendererParams<User>) => {
      const role = params.value as string;
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "default";

      if (role === "admin") {
        variant = "destructive";
      } else if (role === "manager") {
        variant = "default";
      } else {
        variant = "secondary";
      }

      return (
        <div className="flex h-full items-center">
          <Badge variant={variant}>
            {t(`admin.users.roles.${role as "admin" | "manager" | "user"}`)}
          </Badge>
        </div>
      );
    },
    [t],
  );

  // Column definitions
  const columnDefs: ColDef<User>[] = useMemo(
    () => [
      {
        headerName: t("admin.users.table.name"),
        field: "name",
        flex: 1,
        minWidth: 200,
        sortable: true,
        filter: true,
        valueFormatter: (params) => params.value || "-",
      },
      {
        headerName: t("admin.users.table.email"),
        field: "email",
        flex: 1.5,
        minWidth: 250,
        sortable: true,
        filter: true,
      },
      {
        headerName: t("admin.users.table.role"),
        field: "role",
        width: 150,
        sortable: true,
        filter: true,
        cellRenderer: RoleCellRenderer,
      },
      {
        headerName: t("admin.users.table.createdAt"),
        field: "createdAt",
        width: 180,
        sortable: true,
        filter: "agDateColumnFilter",
        valueFormatter: (params) => {
          if (!params.value) return "";
          return new Date(params.value).toLocaleDateString();
        },
      },
      {
        headerName: t("common.actions"),
        cellRenderer: ActionsCellRenderer,
        width: 150,
        sortable: false,
        filter: false,
        pinned: "right",
        cellClass: "actions-cell",
      },
    ],
    [t, ActionsCellRenderer, RoleCellRenderer],
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
    }),
    [],
  );

  const handleFormSubmit = async (data: {
    name: string;
    email: string;
    role: string;
  }) => {
    console.log("[UserTable] handleFormSubmit called with:", data);
    try {
      let result: { temporaryPassword?: string };
      if (selectedUser) {
        result = await onUpdateUser(selectedUser.id, data);
      } else {
        result = await onCreateUser(data);
      }
      console.log("[UserTable] Result from onCreateUser:", result);

      // Store the temporary password in the parent component's state
      if (result.temporaryPassword) {
        console.log(
          "[UserTable] Setting temporaryPassword:",
          result.temporaryPassword,
        );
        setTemporaryPassword(result.temporaryPassword);
      }

      return result;
    } catch (error) {
      console.error("[UserTable] User save failed:", {
        error,
        context: {
          userId: selectedUser?.id,
          operation: selectedUser ? "update" : "create",
          data,
        },
      });
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await onDeleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("User delete failed:", {
        error,
        context: {
          userId: selectedUser.id,
          userEmail: selectedUser.email,
        },
      });
      throw error;
    }
  };

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("admin.users.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("admin.users.subtitle")}
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setSelectedUser(null);
              setFormOpen(true);
            }}
          >
            {t("admin.users.addNew")}
          </Button>
        </div>
      </div>

      <div className="h-[600px]">
        <EnhancedAGGrid<User>
          rowData={users}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          enableToolbar={false}
          enableUndoRedo={false}
          batchEditingEnabled={false}
          enableQuickFilter={true}
          enableFloatingFilter={true}
          enableFilterToolPanel={false}
          gridOptions={{
            rowSelection: "single",
            suppressRowClickSelection: true,
          }}
        />
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedUser(null);
            setTemporaryPassword(null);
          }
        }}
        user={selectedUser}
        onSubmit={handleFormSubmit}
        temporaryPassword={temporaryPassword}
        onPasswordClose={() => setTemporaryPassword(null)}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.users.deleteConfirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
