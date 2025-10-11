import { Suspense } from "react";
import SignInForm from "./_components/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにサインイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Work Management Systemにアクセス
          </p>
        </div>
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
