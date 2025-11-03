import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Session } from "next-auth";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { SessionProvider } from "@/app/providers/session-provider";
import { Navigation } from "@/components/layout/navigation";
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
  title: "Work Management",
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
  const userRole = session?.user?.role || "user";

  // Check if current page is login page
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLoginPage = pathname.includes("/login");

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <SessionProvider session={session as Session | null}>
        {/* Global live region for screen reader announcements */}
        <LiveRegion />
        <div className="min-h-screen bg-background">
          {!isLoginPage && (
            <Navigation userEmail={userEmail} userRole={userRole} />
          )}
          <main className="container mx-auto p-6">{children}</main>
        </div>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
