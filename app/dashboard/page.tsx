import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Dashboard Page (Protected)
 * Simple dashboard to verify authentication is working
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl font-bold text-foreground">
              Work Management
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-foreground">
                {session.user?.email}
                <span className="ml-2 px-2 py-1 bg-muted text-foreground rounded text-xs">
                  {session.user?.role}
                </span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border-2 border-input rounded-md hover:bg-muted"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-card rounded-lg border-2 border-primary/20 shadow p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Welcome, {session.user?.name}!
            </h1>
            <p className="text-muted-foreground mb-6">
              Authentication is working correctly. You are signed in as{" "}
              <span className="font-semibold text-foreground">{session.user?.email}</span> with{" "}
              <span className="font-semibold text-foreground">{session.user?.role}</span> role.
            </p>

            <div className="bg-muted border-2 border-primary/10 rounded-md p-4">
              <h2 className="text-sm font-semibold text-foreground mb-2">
                Session Information
              </h2>
              <pre className="text-xs text-foreground overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div className="mt-6">
              <a
                href="/work-logs"
                className="inline-flex items-center px-4 py-2 border-2 border-input text-sm font-medium rounded-md shadow-sm text-foreground bg-background hover:bg-muted"
              >
                Go to Work Logs →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
