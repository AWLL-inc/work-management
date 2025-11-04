import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card min-h-screen">
        <div className="p-6">
          <h2 className="text-lg font-semibold">工数管理</h2>
        </div>
        <nav className="px-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/user-request">
            <Button variant="ghost" className="w-full justify-start">
              User Request
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
