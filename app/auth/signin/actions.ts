"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { validateCallbackUrl } from "@/lib/utils";

interface SignInActionResult {
  error?: string;
}

export async function signInAction(
  formData: FormData,
): Promise<SignInActionResult | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rawCallbackUrl = (formData.get("callbackUrl") as string) || "/";
  const callbackUrl = validateCallbackUrl(rawCallbackUrl);

  if (!email || !password) {
    return { error: "メールアドレスとパスワードは必須です" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: "メールアドレスまたはパスワードが正しくありません",
          };
        case "Configuration" as any:
          console.error("Auth configuration error:", error);
          return {
            error:
              "システムエラーが発生しました。管理者にお問い合わせください。",
          };
        case "AccessDenied" as any:
          return {
            error:
              "アクセスが拒否されました。アカウントが無効化されている可能性があります。",
          };
        default:
          console.error("Unknown auth error:", error);
          return {
            error: "認証中にエラーが発生しました。もう一度お試しください。",
          };
      }
    }

    // REDIRECT_ERROR の場合は成功なので再スロー
    throw error;
  }
}
