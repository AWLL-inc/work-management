"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import type { SanitizedUser } from "@/lib/api/users";
import { useIncrementalSearch } from "@/lib/hooks/use-incremental-search";
import { cn } from "@/lib/utils";

interface UserSelectProps {
  users: SanitizedUser[];
  selectedUserId: string | null;
  onSelectionChange: (userId: string | null) => void;
  className?: string;
  placeholder?: string;
  showAdminOnly?: boolean;
}

export function UserSelect({
  users,
  selectedUserId,
  onSelectionChange,
  className,
  placeholder,
  showAdminOnly = false,
}: UserSelectProps) {
  const t = useTranslations("workLogs");

  const filteredUsers = React.useMemo(() => {
    return showAdminOnly
      ? users.filter((user) => user.role === "admin" || user.role === "manager")
      : users;
  }, [users, showAdminOnly]);

  const { paginatedItems, hasMore, handleSearch, loadMore } =
    useIncrementalSearch({
      items: filteredUsers,
      searchFields: ["name", "email"],
      pageSize: 20,
    });

  // Convert users to combobox options, including "none" option
  const options: ComboboxOption[] = React.useMemo(() => {
    const userOptions = paginatedItems.map((user) => ({
      value: user.id,
      label: `${user.name} (${user.email})`,
    }));

    // Add "none" option at the beginning
    return [{ value: "none", label: t("search.noneSelected") }, ...userOptions];
  }, [paginatedItems, t]);

  const handleValueChange = (value: string) => {
    if (value === "none" || value === "") {
      onSelectionChange(null);
    } else {
      onSelectionChange(value);
    }
  };

  return (
    <Combobox
      options={options}
      value={selectedUserId || "none"}
      onValueChange={handleValueChange}
      onSearch={handleSearch}
      onLoadMore={loadMore}
      placeholder={placeholder || t("placeholders.selectUser")}
      searchPlaceholder={t("search.searchUser")}
      emptyText={t("search.noUsersFound")}
      className={cn("w-full", className)}
      hasMore={hasMore}
    />
  );
}
