"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const filteredUsers = showAdminOnly
    ? users.filter((user) => user.role === "admin" || user.role === "manager")
    : users;

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onSelectionChange(null);
    } else {
      onSelectionChange(value);
    }
  };

  return (
    <Select value={selectedUserId || "none"} onValueChange={handleValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">選択なし</span>
        </SelectItem>
        {filteredUsers.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span>{user.name}</span>
                {user.email && (
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                )}
              </div>
              <span className="ml-2 text-xs text-muted-foreground capitalize">
                {user.role}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
