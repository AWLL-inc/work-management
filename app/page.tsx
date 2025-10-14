import Link from "next/link";
import { Dashboard } from "@/components/features/dashboard/dashboard";
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground">
                ようこそ、{session.user?.name || session.user?.email}さん
              </p>
              <p className="text-sm text-muted-foreground">
                権限: {session.user?.role || "user"}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href="/work-logs">
                <Button variant="outline" size="sm">
                  作業ログ
                </Button>
              </Link>
              <Link href="/auth/signout">
                <Button variant="outline" size="sm">
                  サインアウト
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
