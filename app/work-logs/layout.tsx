import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function WorkLogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Work Management</h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <a
                  href="/work-logs"
                  className="border-b-2 border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Work Logs
                </a>
                <a
                  href="/dashboard"
                  className="border-b-2 border-transparent hover:border-gray-300 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Dashboard
                </a>
                {session.user.role === "admin" && (
                  <a
                    href="/admin/projects"
                    className="border-b-2 border-transparent hover:border-gray-300 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Admin
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">{session.user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
