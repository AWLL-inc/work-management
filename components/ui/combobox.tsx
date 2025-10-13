"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [open, setOpen] = React.useState(false);
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
      setOpen(false);
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea
          className="h-60"
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
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(option.value);
                      }
                    }}
                    role="option"
                    tabIndex={0}
                    aria-selected={value === option.value}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
      </PopoverContent>
    </Popover>
  );
}
