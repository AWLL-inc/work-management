import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['ja', 'en'],

  // Used when no locale matches
  defaultLocale: 'ja',

  // The locale prefix for pathnames
  localePrefix: 'always'
});

// Re-export types for convenience
export type Locale = typeof routing.locales[number];

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);