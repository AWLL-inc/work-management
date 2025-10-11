"use client";

import { useSearchParams } from "next/navigation";
import ErrorActions from "./ErrorActions";

export default function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "CredentialsSignin":
        return "メールアドレスまたはパスワードが正しくありません。";
      case "Configuration":
        return "認証設定にエラーがあります。管理者にお問い合わせください。";
      case "AccessDenied":
        return "アクセスが拒否されました。適切な権限を持っていない可能性があります。";
      case "Verification":
        return "認証に失敗しました。もう一度お試しください。";
      default:
        return "認証中にエラーが発生しました。もう一度お試しください。";
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Error icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">認証エラー</h2>
          <p className="text-gray-600 mb-6">{getErrorMessage(error)}</p>
          <ErrorActions />
        </div>
      </div>
    </div>
  );
}
