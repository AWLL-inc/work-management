import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "../date-range-picker";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

import { useTranslations } from "next-intl";

describe("DateRangePicker", () => {
  beforeEach(() => {
    const mockT = vi.fn((key: string) => {
      const translations: Record<string, string> = {
        "search.from": "開始日",
        "search.to": "終了日",
        "search.clearDate": "日付をクリア",
        "search.dateRangeError.startAfterEnd":
          "開始日は終了日以前を選択してください",
        "search.dateRangeError.endBeforeStart":
          "終了日は開始日以降を選択してください",
        "search.dateRangeError.periodTooLong": "検索期間は最長1か月までです",
      };
      return translations[key] || key;
    });
    vi.mocked(useTranslations).mockReturnValue(mockT as any);
  });

  const defaultValue = { from: undefined, to: undefined };

  it("should render date inputs with proper labels", () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={defaultValue} onChange={onChange} />);

    expect(screen.getByLabelText("開始日")).toBeInTheDocument();
    expect(screen.getByLabelText("終了日")).toBeInTheDocument();
  });

  it("should call onChange when from date changes", () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={defaultValue} onChange={onChange} />);

    const fromInput = screen.getByLabelText("開始日");
    fireEvent.change(fromInput, { target: { value: "2024-10-01" } });

    expect(onChange).toHaveBeenCalledWith({
      from: new Date("2024-10-01"),
      to: undefined,
    });
  });

  it("should call onChange when to date changes", () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={defaultValue} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    fireEvent.change(toInput, { target: { value: "2024-10-31" } });

    expect(onChange).toHaveBeenCalledWith({
      from: undefined,
      to: new Date("2024-10-31"),
    });
  });

  it("should display current values in inputs", () => {
    const value = {
      from: new Date("2024-10-01"),
      to: new Date("2024-10-31"),
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const fromInput = screen.getByLabelText("開始日") as HTMLInputElement;
    const toInput = screen.getByLabelText("終了日") as HTMLInputElement;

    expect(fromInput.value).toBe("2024-10-01");
    expect(toInput.value).toBe("2024-10-31");
  });

  it("should show clear button when dates are set", () => {
    const value = {
      from: new Date("2024-10-01"),
      to: new Date("2024-10-31"),
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    expect(screen.getByText("日付をクリア")).toBeInTheDocument();
  });

  it("should show clear button when only from date is set", () => {
    const value = {
      from: new Date("2024-10-01"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    expect(screen.getByText("日付をクリア")).toBeInTheDocument();
  });

  it("should show clear button when only to date is set", () => {
    const value = {
      from: undefined,
      to: new Date("2024-10-31"),
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    expect(screen.getByText("日付をクリア")).toBeInTheDocument();
  });

  it("should not show clear button when no dates are set", () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={defaultValue} onChange={onChange} />);

    expect(screen.queryByText("日付をクリア")).not.toBeInTheDocument();
  });

  it("should clear both dates when clear button is clicked", () => {
    const value = {
      from: new Date("2024-10-01"),
      to: new Date("2024-10-31"),
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const clearButton = screen.getByText("日付をクリア");
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
    });
  });

  it("should handle empty string input for from date", () => {
    const onChange = vi.fn();
    const initialValue = { from: new Date("2024-01-01"), to: undefined };
    render(<DateRangePicker value={initialValue} onChange={onChange} />);

    const fromInput = screen.getByLabelText("開始日");
    fireEvent.change(fromInput, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
    });
  });

  it("should handle empty string input for to date", () => {
    const onChange = vi.fn();
    const initialValue = { from: undefined, to: new Date("2024-12-31") };
    render(<DateRangePicker value={initialValue} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    fireEvent.change(toInput, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
    });
  });

  it("should apply custom className", () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateRangePicker
        value={defaultValue}
        onChange={onChange}
        className="custom-class"
      />,
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("should format dates correctly for display", () => {
    const value = {
      from: new Date("2024-01-01T10:30:00Z"),
      to: new Date("2024-12-31T15:45:00Z"),
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const fromInput = screen.getByLabelText("開始日") as HTMLInputElement;
    const toInput = screen.getByLabelText("終了日") as HTMLInputElement;

    expect(fromInput.value).toBe("2024-01-01");
    expect(toInput.value).toBe("2024-12-31");
  });

  it("should preserve existing to date when changing from date", () => {
    const existingTo = new Date("2024-10-31");
    const value = {
      from: undefined,
      to: existingTo,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const fromInput = screen.getByLabelText("開始日");
    fireEvent.change(fromInput, { target: { value: "2024-10-01" } });

    expect(onChange).toHaveBeenCalledWith({
      from: new Date("2024-10-01"),
      to: existingTo,
    });
  });

  it("should preserve existing from date when changing to date", () => {
    const existingFrom = new Date("2024-12-01");
    const value = {
      from: existingFrom,
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    fireEvent.change(toInput, { target: { value: "2024-12-31" } });

    expect(onChange).toHaveBeenCalledWith({
      from: existingFrom,
      to: new Date("2024-12-31"),
    });
  });

  it("should show error when from date is after to date", () => {
    const value = {
      from: undefined,
      to: new Date("2024-01-01"),
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const fromInput = screen.getByLabelText("開始日");
    fireEvent.change(fromInput, { target: { value: "2024-01-15" } });

    expect(
      screen.getByText("開始日は終了日以前を選択してください"),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should show error when to date is before from date", () => {
    const value = {
      from: new Date("2024-01-15"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    fireEvent.change(toInput, { target: { value: "2024-01-01" } });

    expect(
      screen.getByText("終了日は開始日以降を選択してください"),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should clear error when valid dates are entered", () => {
    const value = {
      from: new Date("2024-01-15"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");

    // First enter invalid date to trigger error
    fireEvent.change(toInput, { target: { value: "2024-01-01" } });
    expect(
      screen.getByText("終了日は開始日以降を選択してください"),
    ).toBeInTheDocument();

    // Then enter valid date to clear error
    fireEvent.change(toInput, { target: { value: "2024-01-31" } });
    expect(
      screen.queryByText("終了日は開始日以降を選択してください"),
    ).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({
      from: new Date("2024-01-15"),
      to: new Date("2024-01-31"),
    });
  });

  it("should clear error when clear button is clicked", () => {
    const value = {
      from: new Date("2024-01-15"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");

    // First enter invalid date to trigger error
    fireEvent.change(toInput, { target: { value: "2024-01-01" } });
    expect(
      screen.getByText("終了日は開始日以降を選択してください"),
    ).toBeInTheDocument();

    // Click clear button to clear error
    const clearButton = screen.getByText("日付をクリア");
    fireEvent.click(clearButton);

    expect(
      screen.queryByText("終了日は開始日以降を選択してください"),
    ).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({
      from: undefined,
      to: undefined,
    });
  });

  it("should allow equal from and to dates", () => {
    const value = {
      from: new Date("2024-01-15"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    fireEvent.change(toInput, { target: { value: "2024-01-15" } });

    expect(
      screen.queryByText("終了日は開始日以降を選択してください"),
    ).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({
      from: new Date("2024-01-15"),
      to: new Date("2024-01-15"),
    });
  });

  it("should show error when period exceeds 31 days (from date change)", () => {
    const value = {
      from: undefined,
      to: new Date("2024-12-31"),
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const fromInput = screen.getByLabelText("開始日");
    // Set from date to 2024-01-01, which makes period 365 days (exceeds 31 days)
    fireEvent.change(fromInput, { target: { value: "2024-01-01" } });

    expect(screen.getByText("検索期間は最長1か月までです")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should show error when period exceeds 31 days (to date change)", () => {
    const value = {
      from: new Date("2024-01-01"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    // Set to date to 2024-12-31, which makes period 365 days (exceeds 31 days)
    fireEvent.change(toInput, { target: { value: "2024-12-31" } });

    expect(screen.getByText("検索期間は最長1か月までです")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should allow period of exactly 31 days", () => {
    const value = {
      from: new Date("2024-01-01"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    // Set to date to 2024-02-01, which makes period exactly 31 days
    fireEvent.change(toInput, { target: { value: "2024-02-01" } });

    expect(
      screen.queryByText("検索期間は最長1か月までです"),
    ).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({
      from: new Date("2024-01-01"),
      to: new Date("2024-02-01"),
    });
  });

  it("should reject period of 32 days", () => {
    const value = {
      from: new Date("2024-01-01"),
      to: undefined,
    };
    const onChange = vi.fn();

    render(<DateRangePicker value={value} onChange={onChange} />);

    const toInput = screen.getByLabelText("終了日");
    // Set to date to 2024-02-02, which makes period 32 days (exceeds 31 days)
    fireEvent.change(toInput, { target: { value: "2024-02-02" } });

    expect(screen.getByText("検索期間は最長1か月までです")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
