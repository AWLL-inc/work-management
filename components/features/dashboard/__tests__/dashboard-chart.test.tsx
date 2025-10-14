import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/tests/test-utils";
import type {
  DashboardProjectData,
  DashboardSummary,
  DashboardUserData,
} from "@/types/dashboard";
import { DashboardChart } from "../dashboard-chart";

// Mock Recharts components
vi.mock("recharts", () => ({
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey, name }: any) => (
    <div data-testid={`bar-${dataKey}`} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe("DashboardChart", () => {
  const mockUserData: DashboardUserData[] = [
    {
      date: "2024-10-14",
      userId: "user1",
      userName: "User One",
      hours: 8.0,
    },
    {
      date: "2024-10-14",
      userId: "user2",
      userName: "User Two",
      hours: 6.5,
    },
    {
      date: "2024-10-15",
      userId: "user1",
      userName: "User One",
      hours: 7.0,
    },
  ];

  const mockProjectData: DashboardProjectData[] = [
    {
      date: "2024-10-14",
      projectId: "project1",
      projectName: "Project Alpha",
      userId: "user1",
      userName: "User One",
      hours: 4.0,
    },
    {
      date: "2024-10-14",
      projectId: "project2",
      projectName: "Project Beta",
      userId: "user1",
      userName: "User One",
      hours: 4.0,
    },
  ];

  const mockSummary: DashboardSummary = {
    totalHours: 21.5,
    totalDays: 2,
    averageHoursPerDay: 10.75,
  };

  it("should render chart with user data", () => {
    renderWithIntl(
      <DashboardChart data={mockUserData} view="user" summary={mockSummary} />,
    );

    expect(screen.getByText("Work Hours Chart (By User)")).toBeInTheDocument();
    expect(screen.getByText("Total: 21.5h")).toBeInTheDocument();
    expect(screen.getByText("Average: 10.8h/day")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("should render chart with project data", () => {
    renderWithIntl(
      <DashboardChart
        data={mockProjectData}
        view="project"
        summary={mockSummary}
      />,
    );

    expect(
      screen.getByText("Work Hours Chart (By Project)"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    renderWithIntl(
      <DashboardChart
        data={[]}
        view="user"
        summary={mockSummary}
        loading={true}
      />,
    );

    expect(screen.getByText("Work Hours Chart (By User)")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should show empty state when no data", () => {
    renderWithIntl(
      <DashboardChart
        data={[]}
        view="user"
        summary={{
          totalHours: 0,
          totalDays: 0,
          averageHoursPerDay: 0,
        }}
      />,
    );

    expect(screen.getByText("Work Hours Chart (By User)")).toBeInTheDocument();
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("should render user bars for user view", () => {
    renderWithIntl(
      <DashboardChart data={mockUserData} view="user" summary={mockSummary} />,
    );

    // Check that user bars are rendered
    expect(screen.getByTestId("bar-User One")).toBeInTheDocument();
    expect(screen.getByTestId("bar-User Two")).toBeInTheDocument();
  });

  it("should display summary statistics correctly", () => {
    const customSummary: DashboardSummary = {
      totalHours: 42.25,
      totalDays: 5,
      averageHoursPerDay: 8.45,
    };

    renderWithIntl(
      <DashboardChart
        data={mockUserData}
        view="user"
        summary={customSummary}
      />,
    );

    expect(screen.getByText("Total: 42.3h")).toBeInTheDocument();
    expect(screen.getByText("Average: 8.4h/day")).toBeInTheDocument();
  });

  it("should render chart components", () => {
    renderWithIntl(
      <DashboardChart data={mockUserData} view="user" summary={mockSummary} />,
    );

    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("should handle zero summary values", () => {
    const zeroSummary: DashboardSummary = {
      totalHours: 0,
      totalDays: 0,
      averageHoursPerDay: 0,
    };

    renderWithIntl(
      <DashboardChart
        data={[]}
        view="user"
        summary={zeroSummary}
        loading={false}
      />,
    );

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("should handle project view with stacked bars", () => {
    renderWithIntl(
      <DashboardChart
        data={mockProjectData}
        view="project"
        summary={mockSummary}
      />,
    );

    expect(
      screen.getByText("Work Hours Chart (By Project)"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("should format decimal numbers correctly", () => {
    const precisionSummary: DashboardSummary = {
      totalHours: 15.678,
      totalDays: 3,
      averageHoursPerDay: 5.226,
    };

    renderWithIntl(
      <DashboardChart
        data={mockUserData}
        view="user"
        summary={precisionSummary}
      />,
    );

    expect(screen.getByText("Total: 15.7h")).toBeInTheDocument();
    expect(screen.getByText("Average: 5.2h/day")).toBeInTheDocument();
  });
});
