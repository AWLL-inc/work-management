"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );

  const handleSelect = (categoryId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedCategoryIds, categoryId]);
    } else {
      onSelectionChange(selectedCategoryIds.filter((id) => id !== categoryId));
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const removeCategory = (categoryId: string) => {
    onSelectionChange(selectedCategoryIds.filter((id) => id !== categoryId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Categories Display */}
      <div className="min-h-[2.5rem] p-2 border rounded-md bg-background">
        {selectedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedCategories.slice(0, 3).map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {category.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeCategory(category.id)}
                />
              </Badge>
            ))}
            {selectedCategories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedCategories.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
      >
        {isOpen ? "カテゴリ選択を閉じる" : "カテゴリを選択"}
      </Button>

      {/* Category List */}
      {isOpen && (
        <div className="border rounded-md p-2 bg-background max-h-60">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">カテゴリ選択</span>
            {selectedCategoryIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-xs text-destructive"
              >
                すべて解除
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-40">
            <div className="space-y-2">
              {categories
                .filter((category) => category.isActive)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleSelect(category.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {category.name}
                      {category.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {category.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
