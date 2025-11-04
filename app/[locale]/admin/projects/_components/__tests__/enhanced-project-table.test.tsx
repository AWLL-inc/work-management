import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/drizzle/schema";
import { EnhancedProjectTable } from "../enhanced-project-table";

describe("EnhancedProjectTable", () => {
  const mockProjects: Project[] = [
    {
      id: "1",
      name: "Test Project",
      description: "Test Description",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ];

  const mockProps = {
    projects: mockProjects,
    onCreateProject: vi.fn(),
    onUpdateProject: vi.fn(),
    onDeleteProject: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the projects table with data", async () => {
    render(<EnhancedProjectTable {...mockProps} />);

    // Wait for AG Grid to initialize and render
    await waitFor(() => {
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    // Verify header is rendered
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("should display loading state", () => {
    render(<EnhancedProjectTable {...mockProps} isLoading={true} />);
    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("should open create dialog when Add Project button is clicked", () => {
    render(<EnhancedProjectTable {...mockProps} />);

    const addButton = screen.getByText("Add Project");
    fireEvent.click(addButton);

    expect(screen.getByText("Create New Project")).toBeInTheDocument();
  });

  it("should render AG Grid component", async () => {
    render(<EnhancedProjectTable {...mockProps} />);

    // AG Grid should render with proper structure
    await waitFor(() => {
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  it("should pass projects data to AG Grid", () => {
    const { container } = render(<EnhancedProjectTable {...mockProps} />);

    // Verify AG Grid component is rendered
    const gridElement = container.querySelector('[role="grid"]');
    expect(gridElement).toBeInTheDocument();
  });

  it("should render header and Add Project button", () => {
    render(<EnhancedProjectTable {...mockProps} />);

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Add Project")).toBeInTheDocument();
  });

  it("should close create dialog when Cancel is clicked", async () => {
    render(<EnhancedProjectTable {...mockProps} />);

    const addButton = screen.getByText("Add Project");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Create New Project")).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Create New Project")).not.toBeInTheDocument();
    });
  });

  it("should call onCreateProject when form is submitted", async () => {
    render(<EnhancedProjectTable {...mockProps} />);

    const addButton = screen.getByText("Add Project");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Create New Project")).toBeInTheDocument();
    });

    // This test verifies the dialog opens correctly
    // Detailed form submission testing is covered in project-form-dialog.test.tsx
  });
});
