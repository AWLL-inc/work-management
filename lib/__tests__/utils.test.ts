import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateCallbackUrl } from "../utils";

describe("validateCallbackUrl", () => {
  const originalEnv = process.env.NEXTAUTH_URL;

  beforeEach(() => {
    process.env.NEXTAUTH_URL = "https://app.example.com";
  });

  afterEach(() => {
    process.env.NEXTAUTH_URL = originalEnv;
  });

  it("should allow relative paths", () => {
    expect(validateCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(validateCallbackUrl("/work-logs")).toBe("/work-logs");
    expect(validateCallbackUrl("/")).toBe("/");
  });

  it("should allow relative paths with query parameters", () => {
    expect(validateCallbackUrl("/dashboard?tab=overview")).toBe(
      "/dashboard?tab=overview",
    );
  });

  it("should reject double slashes", () => {
    expect(validateCallbackUrl("//evil.com")).toBe("/");
    expect(validateCallbackUrl("//evil.com/redirect")).toBe("/");
  });

  it("should allow same origin absolute URLs", () => {
    expect(validateCallbackUrl("https://app.example.com/dashboard")).toBe(
      "/dashboard",
    );
    expect(
      validateCallbackUrl("https://app.example.com/work-logs?filter=today"),
    ).toBe("/work-logs?filter=today");
  });

  it("should reject different origin URLs", () => {
    expect(validateCallbackUrl("https://evil.com")).toBe("/");
    expect(validateCallbackUrl("https://evil.com/redirect")).toBe("/");
    expect(validateCallbackUrl("http://evil.com")).toBe("/");
  });

  it("should reject different subdomain URLs", () => {
    expect(validateCallbackUrl("https://evil.example.com")).toBe("/");
    expect(validateCallbackUrl("https://sub.evil.com")).toBe("/");
  });

  it("should handle invalid URLs", () => {
    expect(validateCallbackUrl("not-a-url")).toBe("/");
    expect(validateCallbackUrl("javascript:alert(1)")).toBe("/");
    expect(
      validateCallbackUrl("data:text/html,<script>alert(1)</script>"),
    ).toBe("/");
  });

  it("should handle URL constructor errors", () => {
    expect(validateCallbackUrl("")).toBe("/");
    expect(validateCallbackUrl(" ")).toBe("/");
  });

  it("should work without NEXTAUTH_URL environment variable", () => {
    delete process.env.NEXTAUTH_URL;

    expect(validateCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(validateCallbackUrl("https://evil.com")).toBe("/");
  });

  it("should handle different protocols", () => {
    expect(validateCallbackUrl("ftp://app.example.com/file")).toBe("/");
    expect(validateCallbackUrl("mailto:admin@example.com")).toBe("/");
    expect(validateCallbackUrl("tel:+1234567890")).toBe("/");
  });

  it("should preserve query parameters and fragments for same origin", () => {
    expect(
      validateCallbackUrl(
        "https://app.example.com/dashboard?tab=overview&user=123",
      ),
    ).toBe("/dashboard?tab=overview&user=123");
  });

  it("should handle URLs with different ports", () => {
    process.env.NEXTAUTH_URL = "https://app.example.com:3000";

    expect(validateCallbackUrl("https://app.example.com:3000/dashboard")).toBe(
      "/dashboard",
    );
    expect(validateCallbackUrl("https://app.example.com:8080/dashboard")).toBe(
      "/",
    );
    expect(validateCallbackUrl("https://app.example.com/dashboard")).toBe("/");
  });

  it("should handle edge cases with special characters", () => {
    expect(validateCallbackUrl("/dashboard%20with%20spaces")).toBe(
      "/dashboard%20with%20spaces",
    );
    expect(validateCallbackUrl("/dashboard?query=hello%20world")).toBe(
      "/dashboard?query=hello%20world",
    );
  });
});
