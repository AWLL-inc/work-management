import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { ChangePasswordForm } from "./_components/change-password-form";

export default async function ChangePasswordPage() {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ChangePasswordForm
        isRequired={session.user.passwordResetRequired || false}
      />
    </div>
  );
}
