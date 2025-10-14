"use client";

import { Check } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  onSearch,
  placeholder = "選択してください...",
  searchPlaceholder = "検索...",
  emptyText = "見つかりませんでした",
  disabled = false,
  className,
  hasMore = false,
  onLoadMore,
  loading = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const handleSearch = React.useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearch?.(query);
    },
    [onSearch],
  );

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      onValueChange?.(selectedValue === value ? "" : selectedValue);
      setIsOpen(false);
    },
    [onValueChange, value],
  );

  // Infinite scroll handler
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore],
  );

  return (
    <div className={cn("relative w-full", className)}>
      {/* Selected Value Display */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        tabIndex={0}
        className="w-full p-2 border rounded-md bg-background cursor-pointer flex justify-between items-center"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
      >
        <span className={selectedOption ? "" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-muted-foreground">▼</span>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-md bg-background shadow-lg">
          <div className="p-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <ScrollArea
            className="max-h-60"
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            <div className="p-1">
              {options.length === 0 && !loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <>
                  {options.map((option) => (
                    <div
                      key={option.value}
                      role="option"
                      tabIndex={0}
                      onClick={() => handleSelect(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(option.value);
                        }
                      }}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        value === option.value &&
                          "bg-accent text-accent-foreground",
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.label}
                    </div>
                  ))}
                  {loading && (
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      読み込み中...
                    </div>
                  )}
                  {hasMore && !loading && (
                    <div className="py-1 text-center text-xs text-muted-foreground">
                      スクロールして続きを読み込む
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-transparent border-0 cursor-default"
          tabIndex={-1}
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
