import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { auth } from "@/lib/auth";

export default async function WorkLogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if authentication is disabled for development
  const isDevelopmentMode = process.env.NODE_ENV === "development";
  const isAuthDisabled = process.env.DISABLE_AUTH === "true";

  if (isDevelopmentMode && isAuthDisabled) {
    // Skip authentication in development mode when DISABLE_AUTH=true
  } else {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      redirect("/login");
    }
  }

  return (
    <div className="bg-muted/30">
      <Breadcrumbs />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
