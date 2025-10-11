"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
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

  const [state, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      // Add callbackUrl to form data
      formData.append("callbackUrl", callbackUrl);
      return await signInAction(formData);
    },
    null,
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border">
      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            id="error-message"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          >
            {state.error}
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
              disabled={isPending}
              placeholder="user@example.com"
              className="mt-1"
              aria-describedby={state?.error ? "error-message" : undefined}
              aria-invalid={state?.error ? "true" : "false"}
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
              disabled={isPending}
              placeholder="••••••••"
              className="mt-1"
              aria-describedby={state?.error ? "error-message" : undefined}
              aria-invalid={state?.error ? "true" : "false"}
            />
          </div>
        </div>

        <SubmitButton pending={isPending} />

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
