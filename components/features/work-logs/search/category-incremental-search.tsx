"use client";

import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
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
  placeholder,
}: CategoryIncrementalSearchProps) {
  const t = useTranslations("workLogs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories
        .filter((category) => category.isActive)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .slice(0, 20); // Show first 20 when no search
    }

    return categories
      .filter(
        (category) =>
          category.isActive &&
          category.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 20); // Limit to 20 results
  }, [categories, searchQuery]);

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onSelectionChange(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategoryIds, categoryId]);
    }
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if focus is moving to a dropdown item
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest("[data-dropdown-content]")) {
      return;
    }
    // Delay to allow click events on dropdown items
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder={placeholder || t("search.searchCategories")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full focus-visible:ring-0"
        />

        {/* Dropdown Results */}
        {isDropdownOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
            data-dropdown-content
            role="listbox"
            onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking in dropdown
          >
            {/* Close Button */}
            <div className="flex justify-end p-1 border-b">
              <button
                type="button"
                onClick={handleCloseDropdown}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close dropdown"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            {filteredCategories.length > 0 ? (
              <div className="p-1">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    role="option"
                    tabIndex={0}
                    onClick={() => handleCategoryToggle(category.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCategoryToggle(category.id);
                      }
                    }}
                    className={cn(
                      "flex items-center space-x-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-accent",
                      selectedCategoryIds.includes(category.id) &&
                        "bg-accent/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded",
                        selectedCategoryIds.includes(category.id)
                          ? "bg-primary border-primary"
                          : "border-gray-300",
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
                {searchQuery
                  ? t("search.noCategoriesFound")
                  : t("search.loadingCategories")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
