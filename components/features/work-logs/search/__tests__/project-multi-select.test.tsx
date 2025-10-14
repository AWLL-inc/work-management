import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/drizzle/schema";
import { ProjectMultiSelect } from "../project-multi-select";

// Mock projects data
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Project Alpha",
    description: "First project",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Project Beta",
    description: "Second project",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Project Gamma",
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Inactive Project",
    description: "This should not appear",
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("ProjectMultiSelect", () => {
  it("should render with placeholder when no projects selected", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Check that the placeholder appears in the display area
    const placeholders = screen.getAllByText("プロジェクトを選択");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("should render with custom placeholder", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
        placeholder="カスタムプレースホルダー"
      />,
    );

    expect(screen.getByText("カスタムプレースホルダー")).toBeInTheDocument();
  });

  it("should show selected projects as badges", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={["1", "2"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
  });

  it("should show +count badge when more than 3 projects selected", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={["1", "2", "3", "4"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Should show first 3 projects + count badge
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getByText("Project Gamma")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("should toggle project selection panel when button is clicked", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    const toggleButton = screen.getByRole("button", {
      name: "プロジェクトを選択",
    });
    fireEvent.click(toggleButton);

    expect(screen.getByText("プロジェクト選択")).toBeInTheDocument();
    expect(screen.getByText("プロジェクト選択を閉じる")).toBeInTheDocument();
  });

  it("should show only active projects in selection panel", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    // Should show active projects
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getByText("Project Gamma")).toBeInTheDocument();

    // Should not show inactive project
    expect(screen.queryByText("Inactive Project")).not.toBeInTheDocument();
  });

  it("should call onSelectionChange when project is selected", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    // Click on a project checkbox
    const checkbox = screen.getByRole("checkbox", { name: /Project Alpha/ });
    fireEvent.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith(["1"]);
  });

  it("should call onSelectionChange when project is deselected", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={["1", "2"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    // Click on a selected project checkbox to deselect
    const checkbox = screen.getByRole("checkbox", { name: /Project Alpha/ });
    fireEvent.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith(["2"]);
  });

  it("should remove project when X button is clicked on badge", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={["1", "2"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Find the X button for Project Alpha
    const projectBadge = screen.getByText("Project Alpha").closest(".flex");
    const removeButton = projectBadge?.querySelector("svg");

    if (removeButton) {
      fireEvent.click(removeButton);
    }

    expect(onSelectionChange).toHaveBeenCalledWith(["2"]);
  });

  it('should clear all selections when "すべて解除" is clicked', () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={["1", "2"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    // Click clear all button
    fireEvent.click(screen.getByText("すべて解除"));

    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it("should not show clear button when no projects selected", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    expect(screen.queryByText("すべて解除")).not.toBeInTheDocument();
  });

  it("should show project descriptions when available", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    expect(screen.getByText("First project")).toBeInTheDocument();
    expect(screen.getByText("Second project")).toBeInTheDocument();
  });

  it("should handle projects without descriptions", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    // Project Gamma has no description, should still render
    expect(screen.getByText("Project Gamma")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
        className="custom-class"
      />,
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("should handle empty projects array", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={[]}
        selectedProjectIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    expect(screen.getByText("プロジェクト選択")).toBeInTheDocument();
    // Should not crash and should not show any projects
  });

  it("should check correct projects based on selectedProjectIds", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProjectMultiSelect
        projects={mockProjects}
        selectedProjectIds={["1", "3"]}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Open selection panel
    fireEvent.click(screen.getByRole("button", { name: "プロジェクトを選択" }));

    // Check that correct checkboxes are checked
    const alphaCheckbox = screen.getByRole("checkbox", {
      name: /Project Alpha/,
    });
    const betaCheckbox = screen.getByRole("checkbox", { name: /Project Beta/ });
    const gammaCheckbox = screen.getByRole("checkbox", {
      name: /Project Gamma/,
    });

    expect(alphaCheckbox).toBeChecked();
    expect(betaCheckbox).not.toBeChecked();
    expect(gammaCheckbox).toBeChecked();
  });
});
