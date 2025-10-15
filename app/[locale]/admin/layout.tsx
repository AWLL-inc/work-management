import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { auth } from "@/lib/auth";

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
    redirect("/work-logs");
  }

  return (
    <div className="bg-muted/30">
      <Breadcrumbs />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
