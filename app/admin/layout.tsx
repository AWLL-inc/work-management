import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navigation } from "@/components/layout/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }

  // Check admin role
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation
        userEmail={session.user.email}
        userRole={session.user.role}
      />
      <Breadcrumbs />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
