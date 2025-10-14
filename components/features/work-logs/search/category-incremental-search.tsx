"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useState, useMemo } from "react";
import type { WorkCategory } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

interface CategoryIncrementalSearchProps {
  categories: WorkCategory[];
  selectedCategoryIds: string[];
  onSelectionChange: (categoryIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function CategoryIncrementalSearch({
  categories,
  selectedCategoryIds,
  onSelectionChange,
  className,
  placeholder = "カテゴリを検索",
}: CategoryIncrementalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories
        .filter((category) => category.isActive)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .slice(0, 20); // Show first 20 when no search
    }
    
    return categories
      .filter((category) => 
        category.isActive &&
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 20); // Limit to 20 results
  }, [categories, searchQuery]);

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onSelectionChange(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategoryIds, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    onSelectionChange(selectedCategoryIds.filter(id => id !== categoryId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder="カテゴリ名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full"
        />

        {/* Dropdown Results */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              <div className="p-1">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "flex items-center space-x-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-accent",
                      selectedCategoryIds.includes(category.id) && "bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded",
                        selectedCategoryIds.includes(category.id) 
                          ? "bg-primary border-primary" 
                          : "border-gray-300"
                      )}
                    >
                      {selectedCategoryIds.includes(category.id) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-sm" />
                        </div>
                      )}
                    </div>
                    <span className="flex-1">{category.name}</span>
                    {category.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {category.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? "該当するカテゴリが見つかりません" : "カテゴリを読み込み中..."}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}