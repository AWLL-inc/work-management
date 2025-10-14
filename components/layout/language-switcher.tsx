"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    // Set the locale cookie
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;samesite=lax`;
    
    // Refresh the page to apply the new locale
    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[140px]">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ja">日本語</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function LanguageSwitcherButton() {
  const locale = useLocale();
  const router = useRouter();

  const toggleLocale = () => {
    const newLocale = locale === "ja" ? "en" : "ja";
    // Set the locale cookie
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;samesite=lax`;
    
    // Refresh the page to apply the new locale
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      <span>{locale === "ja" ? "EN" : "日本語"}</span>
    </Button>
  );
}