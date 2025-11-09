import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getAuthenticatedSession } from "@/lib/auth-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return {
    title: t("title"),
    description: "Work management application with time tracking",
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Get user session and role
  const session = await getAuthenticatedSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === "admin";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("home.title")}</h1>
        <p className="text-xl text-muted-foreground mt-2">
          {t("home.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <Card className="w-full md:w-80">
          <CardHeader>
            <CardTitle>{t("nav.dashboard")}</CardTitle>
            <CardDescription>
              {t("home.cards.dashboard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full md:w-80">
          <CardHeader>
            <CardTitle>{t("nav.workLogs")}</CardTitle>
            <CardDescription>
              {t("home.cards.workLogs.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/work-logs">{t("nav.workLogs")}</Link>
            </Button>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="w-full md:w-80">
            <CardHeader>
              <CardTitle>{t("nav.admin")}</CardTitle>
              <CardDescription>
                {t("home.cards.admin.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/projects">{t("nav.admin")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
