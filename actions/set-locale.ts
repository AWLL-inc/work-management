"use server";

import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

export async function setLocale(locale: string) {
  // Validate locale before setting
  if (!routing.locales.includes(locale as "ja" | "en")) {
    throw new Error(
      `Invalid locale: ${locale}. Must be one of: ${routing.locales.join(", ")}`,
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 31536000, // 1 year
  });
}
