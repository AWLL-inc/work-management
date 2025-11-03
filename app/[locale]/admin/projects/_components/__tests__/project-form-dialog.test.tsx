import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/drizzle/schema";
import { ProjectFormDialog } from "../project-form-dialog";

describe("ProjectFormDialog", () => {
  const mockProject: Project = {
    id: "1",
    name: "Test Project",
    description: "Test Description",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    project: null,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create form when project is null", () => {
    render(<ProjectFormDialog {...mockProps} />);
    expect(screen.getByText("Create New Project")).toBeInTheDocument();
  });

  it("should render edit form when project is provided", () => {
    render(<ProjectFormDialog {...mockProps} project={mockProject} />);
    expect(screen.getByText("Edit Project")).toBeInTheDocument();
  });

  it("should display validation error for empty name", async () => {
    render(<ProjectFormDialog {...mockProps} />);

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Project name is required")).toBeInTheDocument();
    });
  });

  it("should call onSubmit with form data when valid", async () => {
    render(<ProjectFormDialog {...mockProps} />);

    const nameInput = screen.getByPlaceholderText("Enter project name");
    fireEvent.change(nameInput, { target: { value: "New Project" } });

    const descInput = screen.getByPlaceholderText("Enter project description");
    fireEvent.change(descInput, { target: { value: "New Description" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        name: "New Project",
        description: "New Description",
        isActive: true,
      });
    });
  });

  it("should pre-fill form with project data when editing", () => {
    render(<ProjectFormDialog {...mockProps} project={mockProject} />);

    const nameInput = screen.getByPlaceholderText(
      "Enter project name",
    ) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(
      "Enter project description",
    ) as HTMLTextAreaElement;

    expect(nameInput.value).toBe("Test Project");
    expect(descInput.value).toBe("Test Description");
  });

  it("should disable buttons when submitting", () => {
    render(<ProjectFormDialog {...mockProps} isSubmitting={true} />);

    const saveButton = screen.getByText("Saving...");
    const cancelButton = screen.getByText("Cancel");

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("should call onOpenChange when Cancel is clicked", () => {
    render(<ProjectFormDialog {...mockProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should have isActive checkbox checked by default for new project", () => {
    render(<ProjectFormDialog {...mockProps} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("should reflect project isActive state when editing", () => {
    const inactiveProject = { ...mockProject, isActive: false };
    render(<ProjectFormDialog {...mockProps} project={inactiveProject} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("should toggle isActive checkbox", async () => {
    render(<ProjectFormDialog {...mockProps} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it("should reset form after successful submission", async () => {
    render(<ProjectFormDialog {...mockProps} />);

    const nameInput = screen.getByPlaceholderText("Enter project name");
    fireEvent.change(nameInput, { target: { value: "New Project" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    // After successful submission, form should be reset
    await waitFor(() => {
      const nameInputAfter = screen.getByPlaceholderText(
        "Enter project name",
      ) as HTMLInputElement;
      expect(nameInputAfter.value).toBe("");
    });
  });
});
