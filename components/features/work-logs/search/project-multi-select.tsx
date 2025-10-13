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
import type { Project } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

interface ProjectMultiSelectProps {
  projects: Project[];
  selectedProjectIds: string[];
  onSelectionChange: (projectIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function ProjectMultiSelect({
  projects,
  selectedProjectIds,
  onSelectionChange,
  className,
  placeholder = "プロジェクトを選択",
}: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedProjects = projects.filter((project) =>
    selectedProjectIds.includes(project.id),
  );

  const handleSelect = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      // Remove from selection
      onSelectionChange(selectedProjectIds.filter((id) => id !== projectId));
    } else {
      // Add to selection
      onSelectionChange([...selectedProjectIds, projectId]);
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
            {selectedProjects.length > 0 ? (
              selectedProjects.length <= 3 ? (
                selectedProjects.map((project) => (
                  <Badge
                    key={project.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {project.name}
                  </Badge>
                ))
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {selectedProjects[0]?.name}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    +{selectedProjects.length - 1}
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
          <CommandInput placeholder="プロジェクトを検索..." />
          <CommandList>
            <CommandEmpty>プロジェクトが見つかりません。</CommandEmpty>
            <CommandGroup>
              {selectedProjectIds.length > 0 && (
                <CommandItem
                  onSelect={clearSelection}
                  className="text-destructive"
                >
                  <span>すべての選択を解除</span>
                </CommandItem>
              )}
              {projects
                .filter((project) => project.isActive)
                .map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelect(project.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProjectIds.includes(project.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {project.name}
                    {project.description && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {project.description}
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
