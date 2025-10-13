"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { WorkCategory } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

interface CategoryMultiSelectProps {
  categories: WorkCategory[];
  selectedCategoryIds: string[];
  onSelectionChange: (categoryIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function CategoryMultiSelect({
  categories,
  selectedCategoryIds,
  onSelectionChange,
  className,
  placeholder = "カテゴリを選択",
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );

  const handleSelect = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      // Remove from selection
      onSelectionChange(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      // Add to selection
      onSelectionChange([...selectedCategoryIds, categoryId]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
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
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedCategories.length > 0 ? (
              selectedCategories.length <= 3 ? (
                selectedCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {category.name}
                  </Badge>
                ))
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCategories[0]?.name}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    +{selectedCategories.length - 1}
                  </Badge>
                </>
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder="カテゴリを検索..." />
          <CommandList>
            <CommandEmpty>カテゴリが見つかりません。</CommandEmpty>
            <CommandGroup>
              {selectedCategoryIds.length > 0 && (
                <CommandItem
                  onSelect={clearSelection}
                  className="text-destructive"
                >
                  <span>すべての選択を解除</span>
                </CommandItem>
              )}
              {categories
                .filter((category) => category.isActive)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleSelect(category.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCategoryIds.includes(category.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {category.name}
                    {category.description && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {category.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
