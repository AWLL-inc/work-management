import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardFilters as DashboardFiltersType } from "@/types/dashboard";
import { DashboardFilters } from "../dashboard-filters";

// Mock the Select component
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div
      data-testid="select-trigger"
      onClick={() => onValueChange?.(value === "user" ? "project" : "user")}
    >
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: () => <span>Selected</span>,
}));

describe("DashboardFilters", () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnApplyFilters = vi.fn();

  const defaultFilters: DashboardFiltersType = {
    view: "user",
    startDate: "2024-10-01",
    endDate: "2024-10-31",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all filter controls", () => {
    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    expect(screen.getByText("表示方法")).toBeInTheDocument();
    expect(screen.getByText("期間選択")).toBeInTheDocument();
    expect(screen.getByText("過去7日")).toBeInTheDocument();
    expect(screen.getByText("過去30日")).toBeInTheDocument();
    expect(screen.getByText("過去90日")).toBeInTheDocument();
    expect(screen.getByLabelText("開始日")).toBeInTheDocument();
    expect(screen.getByLabelText("終了日")).toBeInTheDocument();
  });

  it("should display current filter values", () => {
    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText("開始日") as HTMLInputElement;
    const endDateInput = screen.getByLabelText("終了日") as HTMLInputElement;

    expect(startDateInput.value).toBe("2024-10-01");
    expect(endDateInput.value).toBe("2024-10-31");
  });

  it("should call onFiltersChange when start date is changed", async () => {
    const user = userEvent.setup();

    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText("開始日");

    // Simulate onChange event directly
    await user.click(startDateInput);
    await user.keyboard("{Control>}a{/Control}2024-09-01");

    // Check that onChange was called with the correct value
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2024-09-01",
      }),
    );
  });

  it("should call onFiltersChange when end date is changed", async () => {
    const user = userEvent.setup();

    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const endDateInput = screen.getByLabelText("終了日");

    // Simulate onChange event directly
    await user.click(endDateInput);
    await user.keyboard("{Control>}a{/Control}2024-11-30");

    // Check that onChange was called with the correct value
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        endDate: "2024-11-30",
      }),
    );
  });

  it("should call onFiltersChange when view is changed", async () => {
    const user = userEvent.setup();

    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const selectTrigger = screen.getByTestId("select-trigger");
    await user.click(selectTrigger);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      view: "project",
    });
  });

  it("should set preset date ranges when preset buttons are clicked", async () => {
    const user = userEvent.setup();

    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const past7DaysButton = screen.getByText("過去7日");
    await user.click(past7DaysButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        view: "user",
        startDate: expect.any(String),
        endDate: expect.any(String),
      }),
    );
  });

  it("should reset filters when reset button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const resetButton = screen.getByText("リセット");
    await user.click(resetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      view: "user",
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
  });

  it("should show apply button when onApplyFilters is provided", () => {
    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApplyFilters={mockOnApplyFilters}
      />,
    );

    expect(screen.getByText("適用")).toBeInTheDocument();
  });

  it("should call onApplyFilters when apply button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApplyFilters={mockOnApplyFilters}
      />,
    );

    const applyButton = screen.getByText("適用");
    await user.click(applyButton);

    expect(mockOnApplyFilters).toHaveBeenCalled();
  });

  it("should disable buttons when loading", () => {
    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApplyFilters={mockOnApplyFilters}
        isLoading={true}
      />,
    );

    const resetButton = screen.getByText("リセット");
    const applyButton = screen.getByText("読み込み中...");

    expect(resetButton).toBeDisabled();
    expect(applyButton).toBeDisabled();
  });

  it("should handle undefined date values", () => {
    const filtersWithoutDates: DashboardFiltersType = {
      view: "user",
    };

    render(
      <DashboardFilters
        filters={filtersWithoutDates}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText("開始日") as HTMLInputElement;
    const endDateInput = screen.getByLabelText("終了日") as HTMLInputElement;

    expect(startDateInput.value).toBe("");
    expect(endDateInput.value).toBe("");
  });

  it("should handle clearing date inputs", async () => {
    const user = userEvent.setup();

    render(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText("開始日");
    await user.clear(startDateInput);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      startDate: undefined,
    });
  });
});
