import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/tests/test-utils";
import type { DashboardFilters as DashboardFiltersType } from "@/types/dashboard";
import { DashboardFilters } from "../dashboard-filters";

// Mock the Select component
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <button
      type="button"
      data-testid="select-trigger"
      onClick={() => onValueChange?.(value === "user" ? "project" : "user")}
      onKeyDown={() => {}}
    >
      {children}
    </button>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => (
    <button type="button">{children}</button>
  ),
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
    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    expect(screen.getByText("View Method")).toBeInTheDocument();
    expect(screen.getByText("Period Selection")).toBeInTheDocument();
    expect(screen.getByText("Last 7 Days")).toBeInTheDocument();
    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
    expect(screen.getByText("Last 90 Days")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
  });

  it("should display current filter values", () => {
    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText(
      "Start Date",
    ) as HTMLInputElement;
    const endDateInput = screen.getByLabelText("End Date") as HTMLInputElement;

    expect(startDateInput.value).toBe("2024-10-01");
    expect(endDateInput.value).toBe("2024-10-31");
  });

  it("should call onFiltersChange when start date is changed", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText("Start Date");

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

    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const endDateInput = screen.getByLabelText("End Date");

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

    renderWithIntl(
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

    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const past7DaysButton = screen.getByText("Last 7 Days");
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

    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const resetButton = screen.getByText("Reset");
    await user.click(resetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      view: "user",
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
  });

  it("should show apply button when onApplyFilters is provided", () => {
    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApplyFilters={mockOnApplyFilters}
      />,
    );

    expect(screen.getByText("Apply")).toBeInTheDocument();
  });

  it("should call onApplyFilters when apply button is clicked", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApplyFilters={mockOnApplyFilters}
      />,
    );

    const applyButton = screen.getByText("Apply");
    await user.click(applyButton);

    expect(mockOnApplyFilters).toHaveBeenCalled();
  });

  it("should disable buttons when loading", () => {
    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onApplyFilters={mockOnApplyFilters}
        isLoading={true}
      />,
    );

    const resetButton = screen.getByText("Reset");
    const applyButton = screen.getByText("Loading...");

    expect(resetButton).toBeDisabled();
    expect(applyButton).toBeDisabled();
  });

  it("should handle undefined date values", () => {
    const filtersWithoutDates: DashboardFiltersType = {
      view: "user",
    };

    renderWithIntl(
      <DashboardFilters
        filters={filtersWithoutDates}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText(
      "Start Date",
    ) as HTMLInputElement;
    const endDateInput = screen.getByLabelText("End Date") as HTMLInputElement;

    expect(startDateInput.value).toBe("");
    expect(endDateInput.value).toBe("");
  });

  it("should handle clearing date inputs", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <DashboardFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const startDateInput = screen.getByLabelText("Start Date");
    await user.clear(startDateInput);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      startDate: undefined,
    });
  });
});
