import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  let locale = cookieStore.get("locale")?.value || routing.defaultLocale;
  
  // Validate that the locale is valid
  if (!routing.locales.includes(locale as "ja" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale,
  };
});
