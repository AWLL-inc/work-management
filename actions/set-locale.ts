"use server";

import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

export async function setLocale(locale: string) {
  console.log("[setLocale] Called with locale:", locale);

  // Validate locale before setting
  if (!routing.locales.includes(locale as "ja" | "en")) {
    console.error("[setLocale] Invalid locale:", locale);
    throw new Error(
      `Invalid locale: ${locale}. Must be one of: ${routing.locales.join(", ")}`,
    );
  }

  const cookieStore = await cookies();
  // next-intl uses NEXT_LOCALE as the default cookie name
  cookieStore.set("NEXT_LOCALE", locale, {
    httpOnly: false, // Must be false for client-side reading
    sameSite: "lax",
    path: "/",
    maxAge: 31536000, // 1 year
  });

  console.log(
    "[setLocale] Cookie NEXT_LOCALE set successfully for locale:",
    locale,
  );
}
