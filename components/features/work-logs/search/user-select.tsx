"use client";

import * as React from "react";
import { useIncrementalSearch } from "@/lib/hooks/use-incremental-search";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import type { User } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

interface UserSelectProps {
  users: User[];
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
  placeholder = "ユーザーを選択",
  showAdminOnly = false,
}: UserSelectProps) {
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
    return [
      { value: "none", label: "選択なし" },
      ...userOptions,
    ];
  }, [paginatedItems]);

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
      placeholder={placeholder}
      searchPlaceholder="ユーザー名またはメールアドレスで検索..."
      emptyText="ユーザーが見つかりませんでした"
      className={cn("w-full", className)}
      hasMore={hasMore}
    />
  );
}
