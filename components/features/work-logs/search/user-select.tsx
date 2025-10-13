"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [open, setOpen] = useState(false);

  const filteredUsers = showAdminOnly
    ? users.filter((user) => user.role === "admin" || user.role === "manager")
    : users;

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const handleSelect = (userId: string) => {
    if (selectedUserId === userId) {
      // Deselect if already selected
      onSelectionChange(null);
    } else {
      onSelectionChange(userId);
    }
    setOpen(false);
  };

  const clearSelection = () => {
    onSelectionChange(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <span
            className={cn("truncate", !selectedUser && "text-muted-foreground")}
          >
            {selectedUser ? selectedUser.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder="ユーザーを検索..." />
          <CommandList>
            <CommandEmpty>ユーザーが見つかりません。</CommandEmpty>
            <CommandGroup>
              {selectedUserId && (
                <CommandItem
                  onSelect={clearSelection}
                  className="text-destructive"
                >
                  <span>選択を解除</span>
                </CommandItem>
              )}
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name || ""}
                  onSelect={() => handleSelect(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUserId === user.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {user.role}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
