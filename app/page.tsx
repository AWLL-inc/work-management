import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    // This should not happen due to middleware redirect, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">アクセスが拒否されました</h1>
          <p className="mb-4">このページにアクセスするには認証が必要です。</p>
          <Link href="/auth/signin">
            <Button>サインイン</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Work Management System
              </h1>
              <p className="text-gray-600 mt-2">
                ようこそ、{session.user?.name || session.user?.email}さん
              </p>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/signout">
                <Button variant="outline">サインアウト</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">作業ログ</h2>
              <svg
                className="h-8 w-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Work log icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              日々の作業記録を管理し、プロジェクトの進捗を追跡します。
            </p>
            <Link href="/work-logs">
              <Button className="w-full">作業ログを表示</Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                プロジェクト
              </h2>
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Project icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              プロジェクトの管理と進捗状況の確認ができます。
            </p>
            <Link href="/projects">
              <Button className="w-full" variant="outline">
                プロジェクト一覧
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                ダッシュボード
              </h2>
              <svg
                className="h-8 w-8 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Dashboard icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              全体的な統計情報と分析データを確認できます。
            </p>
            <Link href="/dashboard">
              <Button className="w-full" variant="outline">
                ダッシュボード
              </Button>
            </Link>
          </div>
        </main>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Work Management System - 認証されたユーザーのみアクセス可能</p>
          <p className="mt-1">ユーザー権限: {session.user?.role || "user"}</p>
        </footer>
      </div>
    </div>
  );
}
