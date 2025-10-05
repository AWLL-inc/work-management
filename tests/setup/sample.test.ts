import { describe, it, expect } from "vitest";

/**
 * Sample test to verify Vitest setup
 * This test should pass and demonstrates basic testing functionality
 */
describe("Sample Test Suite", () => {
  it("should pass basic assertion", () => {
    expect(true).toBe(true);
  });

  it("should perform basic arithmetic", () => {
    expect(1 + 1).toBe(2);
  });

  it("should work with strings", () => {
    const message = "Testing environment is working!";
    expect(message).toContain("working");
  });

  it("should work with arrays", () => {
    const fruits = ["apple", "banana", "orange"];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain("banana");
  });

  it("should work with objects", () => {
    const user = {
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };

    expect(user).toHaveProperty("name");
    expect(user.email).toBe("test@example.com");
  });
});
