"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);

  const selectedProjects = projects.filter((project) =>
    selectedProjectIds.includes(project.id),
  );

  const handleSelect = (projectId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProjectIds, projectId]);
    } else {
      onSelectionChange(selectedProjectIds.filter((id) => id !== projectId));
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const removeProject = (projectId: string) => {
    onSelectionChange(selectedProjectIds.filter((id) => id !== projectId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Projects Display */}
      <div className="min-h-[2.5rem] p-2 border rounded-md bg-background">
        {selectedProjects.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedProjects.slice(0, 3).map((project) => (
              <Badge
                key={project.id}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {project.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeProject(project.id)}
                />
              </Badge>
            ))}
            {selectedProjects.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedProjects.length - 3}
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
        {isOpen ? "プロジェクト選択を閉じる" : "プロジェクトを選択"}
      </Button>

      {/* Project List */}
      {isOpen && (
        <div className="border rounded-md p-2 bg-background max-h-60">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">プロジェクト選択</span>
            {selectedProjectIds.length > 0 && (
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
              {projects
                .filter((project) => project.isActive)
                .map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={(checked) => 
                        handleSelect(project.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {project.name}
                      {project.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {project.description}
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
