"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";

/**
 * Submit button component with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-2 px-4 border-2 border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

/**
 * Login Page
 * Simple credentials-based authentication form
 */
export default function LoginPage() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const searchParams = useSearchParams();

  // Check for logout success message
  useEffect(() => {
    if (searchParams.get("logout") === "success") {
      setSuccessMessage("You have been successfully logged out.");
      // Clear the message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccessMessage("");
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg border border-border shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-foreground">
            Work Management
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" action={handleSubmit}>
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border-2 border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full px-3 py-2 border-2 border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="••••••••"
              />
            </div>
          </div>

          <SubmitButton />

          <div className="mt-4 text-xs text-muted-foreground">
            <p className="font-semibold">Test accounts:</p>
            <ul className="mt-2 space-y-1">
              <li>Admin: admin@example.com / admin123</li>
              <li>Manager: manager@example.com / manager123</li>
              <li>User: user@example.com / user123</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
