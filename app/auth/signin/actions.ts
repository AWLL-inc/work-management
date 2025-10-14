"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function signInAction(
  _prevState: { error?: string },
  formData: FormData,
) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate inputs
    if (!email || !password) {
      return { error: "メールアドレスとパスワードは必須です" };
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    // This will trigger a redirect to the dashboard
    redirect("/dashboard");
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
    throw error;
  }
}
