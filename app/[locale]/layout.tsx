import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Session } from "next-auth";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { SessionProvider } from "@/app/providers/session-provider";
import { Navigation } from "@/components/layout/navigation";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LiveRegion } from "@/components/ui/live-region";
import { routing } from "@/i18n/routing";
import { getAuthenticatedSession } from "@/lib/auth-helpers";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "工数管理",
  description: "Modern work management application with Next.js",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as "ja" | "en")) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();
  const session = await getAuthenticatedSession();

  // Get user info for navigation
  const userEmail = session?.user?.email || null;
  const userName = session?.user?.name || null;
  const userRole = session?.user?.role || "user";
  const passwordResetRequired = session?.user?.passwordResetRequired || false;

  // Check if current page is login page or auth-related page
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLoginPage = pathname.includes("/login");
  const isAuthPage =
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password");

  // Hide navigation if:
  // 1. User is on login page
  // 2. User is on auth pages (forgot-password, reset-password)
  // 3. User has passwordResetRequired flag (forced password change)
  const shouldHideNavigation =
    isLoginPage || isAuthPage || passwordResetRequired;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <SessionProvider session={session as Session | null}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global live region for screen reader announcements */}
          <LiveRegion />
          <div className="min-h-screen bg-background">
            {!shouldHideNavigation && (
              <Navigation
                userEmail={userEmail}
                userName={userName}
                userRole={userRole}
              />
            )}
            <main className="container mx-auto p-6">{children}</main>
          </div>
        </ThemeProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
