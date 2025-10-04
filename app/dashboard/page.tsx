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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl font-bold text-gray-900">
              Work Management
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                {session.user?.email}
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {session.user?.name}!
            </h1>
            <p className="text-gray-600 mb-6">
              Authentication is working correctly. You are signed in as{" "}
              <span className="font-semibold">{session.user?.email}</span> with{" "}
              <span className="font-semibold">{session.user?.role}</span> role.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h2 className="text-sm font-semibold text-blue-900 mb-2">
                Session Information
              </h2>
              <pre className="text-xs text-blue-800 overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div className="mt-6">
              <a
                href="/work-logs"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
