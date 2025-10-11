"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateCallbackUrl } from "@/lib/utils";
import { signInAction } from "../actions";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "サインイン中..." : "サインイン"}
    </Button>
  );
}

export default function SignInForm() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/";
  const callbackUrl = validateCallbackUrl(rawCallbackUrl);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError("");

    // Add callbackUrl to form data
    formData.append("callbackUrl", callbackUrl);

    const result = await signInAction(formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border">
      <form action={handleSubmit} className="space-y-6">
        {error && (
          <div
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            id="error-message"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              placeholder="user@example.com"
              className="mt-1"
              aria-describedby={error ? "error-message" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
          </div>

          <div>
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
              placeholder="••••••••"
              className="mt-1"
              aria-describedby={error ? "error-message" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
          </div>
        </div>

        <SubmitButton pending={pending} />

        <div className="mt-4 text-xs text-gray-600">
          <p className="font-semibold">テストアカウント:</p>
          <ul className="mt-2 space-y-1">
            <li>管理者: admin@example.com / admin123</li>
            <li>マネージャー: manager@example.com / manager123</li>
            <li>ユーザー: user@example.com / user123</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
