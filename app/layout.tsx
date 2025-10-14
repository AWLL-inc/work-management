import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { SessionProvider } from "@/app/providers/session-provider";
import { Navigation } from "@/components/layout/navigation";
import { auth } from "@/lib/auth";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Work Management",
  description: "Modern work management application with Next.js",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();

  // Get user info for navigation
  const userEmail = session?.user?.email || null;
  const userRole = session?.user?.role || "user";

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProvider session={session}>
            <div className="min-h-screen bg-background">
              <Navigation userEmail={userEmail} userRole={userRole} />
              <main className="container mx-auto p-6">{children}</main>
            </div>
          </SessionProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
