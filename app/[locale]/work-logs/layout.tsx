import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Navigation } from "@/components/layout/navigation";
import { auth } from "@/lib/auth";

export default async function WorkLogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if authentication is disabled for development
  const isDevelopmentMode = process.env.NODE_ENV === "development";
  const isAuthDisabled = process.env.DISABLE_AUTH === "true";

  let session = null;
  let userEmail = "test@example.com";
  let userRole = "user";

  if (isDevelopmentMode && isAuthDisabled) {
    // Skip authentication in development mode when DISABLE_AUTH=true
  } else {
    session = await auth();

    // Check authentication
    if (!session?.user) {
      redirect("/login");
    }

    userEmail = session.user.email || "test@example.com";
    userRole = session.user.role || "user";
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation userEmail={userEmail} userRole={userRole} />
      <Breadcrumbs />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
