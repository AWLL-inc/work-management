import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

// Mock next-auth completely to avoid module resolution issues
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    type: string;
    constructor(message: string) {
      super(message);
      this.type = message;
    }
  },
}));

// Mock the dependencies
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}));

// Import AuthError after mocking
const { AuthError } = await import("next-auth");

// Import the action after all mocks are in place
const { signInAction } = await import("@/app/auth/signin/actions");

const mockSignIn = vi.mocked(await import("@/lib/auth")).signIn as Mock;

describe("signInAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for missing email", async () => {
    const formData = new FormData();
    formData.append("password", "password123");
    formData.append("callbackUrl", "/");

    const result = await signInAction({ error: undefined }, formData);

    expect(result?.error).toBe("メールアドレスとパスワードは必須です");
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should return error for missing password", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("callbackUrl", "/");

    const result = await signInAction({ error: undefined }, formData);

    expect(result?.error).toBe("メールアドレスとパスワードは必須です");
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should return error for missing both email and password", async () => {
    const formData = new FormData();
    formData.append("callbackUrl", "/");

    const result = await signInAction({ error: undefined }, formData);

    expect(result?.error).toBe("メールアドレスとパスワードは必須です");
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should call signIn with correct parameters", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");
    formData.append("callbackUrl", "/dashboard");

    // Mock redirect to throw NEXT_REDIRECT error
    mockSignIn.mockResolvedValueOnce(undefined);

    // Since signInAction calls redirect after successful signIn, we expect a NEXT_REDIRECT error
    await expect(signInAction({ error: undefined }, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "test@example.com",
      password: "password123",
      redirectTo: "/dashboard",
    });
  });

  it("should return error for CredentialsSignin", async () => {
    const formData = new FormData();
    formData.append("email", "invalid@example.com");
    formData.append("password", "wrongpassword");
    formData.append("callbackUrl", "/");

    const authError = new AuthError("CredentialsSignin");
    authError.type = "CredentialsSignin";
    mockSignIn.mockRejectedValueOnce(authError);

    const result = await signInAction({ error: undefined }, formData);

    expect(result?.error).toBe(
      "メールアドレスまたはパスワードが正しくありません",
    );
  });

  it("should return generic error for unknown AuthError", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");
    formData.append("callbackUrl", "/");

    const authError = new AuthError("UnknownError");
    authError.type = "UnknownError" as any;
    mockSignIn.mockRejectedValueOnce(authError);

    const result = await signInAction({ error: undefined }, formData);

    expect(result?.error).toBe(
      "認証中にエラーが発生しました。もう一度お試しください。",
    );
  });

  it("should rethrow non-AuthError exceptions", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");
    formData.append("callbackUrl", "/");

    const redirectError = new Error("NEXT_REDIRECT");
    mockSignIn.mockRejectedValueOnce(redirectError);

    await expect(signInAction({ error: undefined }, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
  });

  it("should use default callbackUrl when not provided", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");

    mockSignIn.mockResolvedValueOnce(undefined);

    // Since signInAction calls redirect after successful signIn, we expect a NEXT_REDIRECT error
    await expect(signInAction({ error: undefined }, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "test@example.com",
      password: "password123",
      redirectTo: "/dashboard",
    });
  });

  it("should validate callbackUrl", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");
    formData.append("callbackUrl", "https://evil.com");

    mockSignIn.mockResolvedValueOnce(undefined);

    // Since signInAction calls redirect after successful signIn, we expect a NEXT_REDIRECT error
    await expect(signInAction({ error: undefined }, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "test@example.com",
      password: "password123",
      redirectTo: "/dashboard",
    });
  });
});
