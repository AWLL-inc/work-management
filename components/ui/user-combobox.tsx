"use client";

import * as React from "react";
import { useIncrementalSearch } from "@/lib/hooks/use-incremental-search";
import { Combobox, type ComboboxOption } from "./combobox";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface UserComboboxProps {
  users: User[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserCombobox({
  users,
  value,
  onValueChange,
  placeholder = "ユーザーを選択してください...",
  disabled = false,
  className,
}: UserComboboxProps) {
  const { paginatedItems, hasMore, handleSearch, loadMore } =
    useIncrementalSearch({
      items: users,
      searchFields: ["name", "email"],
      pageSize: 20,
    });

  // Convert users to combobox options
  const options: ComboboxOption[] = React.useMemo(() => {
    return paginatedItems.map((user) => ({
      value: user.id,
      label: `${user.name} (${user.email})`,
    }));
  }, [paginatedItems]);

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      onSearch={handleSearch}
      onLoadMore={loadMore}
      placeholder={placeholder}
      searchPlaceholder="ユーザー名またはメールアドレスで検索..."
      emptyText="ユーザーが見つかりませんでした"
      disabled={disabled}
      className={className}
      hasMore={hasMore}
    />
  );
}
