import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/drizzle/schema";
import { UserSelect } from "../user-select";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

import { useTranslations } from "next-intl";

// Mock users data
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    emailVerified: null,
    image: null,
    passwordHash: null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Jane Manager",
    email: "jane@example.com",
    emailVerified: null,
    image: null,
    passwordHash: null,
    role: "manager",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Bob Admin",
    email: "bob@example.com",
    emailVerified: null,
    image: null,
    passwordHash: null,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("UserSelect", () => {
  beforeEach(() => {
    const mockT = vi.fn((key: string) => {
      const translations: Record<string, string> = {
        "search.noneSelected": "選択なし",
        "placeholders.selectUser": "ユーザーを選択",
        "search.searchUser": "ユーザー名またはメールアドレスで検索...",
        "search.noUsersFound": "ユーザーが見つかりません",
      };
      return translations[key] || key;
    });
    vi.mocked(useTranslations).mockReturnValue(mockT as any);
  });

  it("should render combobox with default none option", () => {
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

    // Should show all users in the new format: "Name (email)"
    expect(screen.getByText("John Doe (john@example.com)")).toBeInTheDocument();
    expect(
      screen.getByText("Jane Manager (jane@example.com)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bob Admin (bob@example.com)")).toBeInTheDocument();
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
    expect(
      screen.queryByText("John Doe (john@example.com)"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Jane Manager (jane@example.com)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bob Admin (bob@example.com)")).toBeInTheDocument();
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

    // Click on a user option
    fireEvent.click(screen.getByText("John Doe (john@example.com)"));

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
    const noneOptions = screen.getAllByText("選択なし");
    const noneOptionInDropdown = noneOptions.find((option) =>
      option.closest('[role="option"]'),
    );

    if (noneOptionInDropdown) {
      fireEvent.click(noneOptionInDropdown);
    }

    expect(onSelectionChange).toHaveBeenCalledWith(null);
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

    // Should show the selected user in the new format: "Name (email)"
    expect(
      screen.getByText("Jane Manager (jane@example.com)"),
    ).toBeInTheDocument();
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

  it("should support search functionality", () => {
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

    // Should show search input
    const searchInput = screen.getByPlaceholderText(
      "ユーザー名またはメールアドレスで検索...",
    );
    expect(searchInput).toBeInTheDocument();

    // Search should work
    fireEvent.change(searchInput, { target: { value: "John" } });
    expect(screen.getByText("John Doe (john@example.com)")).toBeInTheDocument();
  });

  it("should show incremental search behavior with pagination", () => {
    // Create more than 20 users to test pagination
    const manyUsers: User[] = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      emailVerified: null,
      image: null,
      passwordHash: null,
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const onSelectionChange = vi.fn();
    render(
      <UserSelect
        users={manyUsers}
        selectedUserId={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Should show first 20 users + "選択なし" option
    expect(screen.getByText("User 1 (user1@example.com)")).toBeInTheDocument();
    expect(
      screen.getByText("User 20 (user20@example.com)"),
    ).toBeInTheDocument();

    // Should not show users beyond page 1 initially
    expect(
      screen.queryByText("User 21 (user21@example.com)"),
    ).not.toBeInTheDocument();
  });
});
