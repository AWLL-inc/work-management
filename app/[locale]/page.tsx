import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  
  return {
    title: t('title'),
    description: 'Work management application with time tracking',
  };
}

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Modern work management application with time tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('nav.dashboard')}</CardTitle>
            <CardDescription>
              View work hours and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                {t('nav.dashboard')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('nav.workLogs')}</CardTitle>
            <CardDescription>
              Manage your work log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/work-logs">
                {t('nav.workLogs')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('nav.admin')}</CardTitle>
            <CardDescription>
              Manage projects and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/projects">
                {t('nav.admin')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}