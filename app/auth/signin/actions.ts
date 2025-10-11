"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

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
          return { error: "メールアドレスまたはパスワードが正しくありません" };
        default:
          return {
            error: "認証中にエラーが発生しました。もう一度お試しください。",
          };
      }
    }
    // If it's a redirect (successful login), let it throw
    throw error;
  }
}
