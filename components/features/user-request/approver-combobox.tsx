"use client";

import * as React from "react";
import { type User, UserCombobox } from "@/components/ui/user-combobox";

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
  const availableApprovers = React.useMemo(() => {
    return approvers.filter(
      (user) => user.role === "admin" || user.role === "manager",
    );
  }, [approvers]);

  return (
    <UserCombobox
      users={availableApprovers}
      value={value}
      onValueChange={onValueChange}
      placeholder="承認者を選択してください..."
      disabled={disabled}
      className={className}
    />
  );
}
