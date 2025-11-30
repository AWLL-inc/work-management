"use client";

import * as React from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useIncrementalSearch } from "@/lib/hooks/use-incremental-search";
import { cn } from "@/lib/utils";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface ApproverComboboxProps {
  approvers: User[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ApproverCombobox({
  approvers,
  value,
  onValueChange,
  disabled = false,
  className,
}: ApproverComboboxProps) {
  // Filter only users who can approve (admin or manager roles)
  const filteredApprovers = React.useMemo(() => {
    return approvers.filter(
      (user) => user.role === "admin" || user.role === "manager",
    );
  }, [approvers]);

  const { paginatedItems, hasMore, handleSearch, loadMore } =
    useIncrementalSearch({
      items: filteredApprovers,
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
      placeholder="承認者を選択してください..."
      searchPlaceholder="ユーザー名またはメールアドレスで検索..."
      emptyText="承認者が見つかりませんでした"
      disabled={disabled}
      className={cn("w-full", className)}
      hasMore={hasMore}
    />
  );
}
