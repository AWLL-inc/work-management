import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { User } from "@/drizzle/schema";
import { UserSelect } from "../user-select";

// Mock users data
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Jane Manager",
    email: "jane@example.com",
    role: "manager",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Bob Admin",
    email: "bob@example.com",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("UserSelect", () => {
  it("should render select with default none option", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    // When nothing is selected, it shows the "選択なし" option
    expect(screen.getByText("選択なし")).toBeInTheDocument();
  });

  it("should render with custom placeholder when no selection", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
        placeholder="カスタムプレースホルダー"
      />,
    );

    // The component shows "選択なし" by default, not the placeholder
    expect(screen.getByText("選択なし")).toBeInTheDocument();
  });

  it("should show all users when not filtering by admin", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Should show all users plus "選択なし"
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Manager")).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getAllByText("選択なし")).toHaveLength(2); // One in trigger, one in dropdown
  });

  it("should show only admin and manager when showAdminOnly is true", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
        showAdminOnly={true}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Should only show admin and manager users
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Jane Manager")).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getAllByText("選択なし")).toHaveLength(2); // One in trigger, one in dropdown
  });

  it("should call onSelectionChange with user id when user is selected", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Click on a user
    fireEvent.click(screen.getByText("John Doe"));

    expect(onSelectionChange).toHaveBeenCalledWith("1");
  });

  it('should call onSelectionChange with null when "選択なし" is selected', () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId="1"
        onSelectionChange={onSelectionChange}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Find the clickable option with role="option" and text "選択なし"
    const noneOption = screen.getByRole("option", { name: /選択なし/ });
    fireEvent.click(noneOption);

    expect(onSelectionChange).toHaveBeenCalledWith(null);
  });

  it("should display user information with email and role", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Check that email and role are displayed
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();

    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("manager")).toBeInTheDocument();

    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("should handle users without email", () => {
    const usersWithoutEmail: User[] = [
      {
        id: "1",
        name: "No Email User",
        email: null,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={usersWithoutEmail}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Should show user name without email
    expect(screen.getByText("No Email User")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <UserSelect
        users={mockUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
        className="custom-class"
      />,
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("should show selected user when selectedUserId is provided", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={mockUsers}
        selectedUserId="2"
        onSelectionChange={onSelectionChange}
      />,
    );

    // Should show the selected user's name in the trigger
    expect(screen.getByText("Jane Manager")).toBeInTheDocument();
  });

  it("should handle empty users array", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={[]}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Should show "選択なし" options (one in trigger, one in dropdown)
    expect(screen.getAllByText("選択なし")).toHaveLength(2);
  });
});
