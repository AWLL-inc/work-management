"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { setLocale } from "@/actions/set-locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const handleLocaleChange = async (newLocale: string) => {
    if (isChanging) return;

    try {
      setIsChanging(true);
      // Set the locale cookie using server action
      await setLocale(newLocale);

      // Refresh the page to apply the new locale
      router.refresh();
    } catch (error) {
      console.error("Failed to change locale:", error);
      // Show error to user (you can add toast notification here if available)
      alert(
        locale === "ja"
          ? "言語の変更に失敗しました"
          : "Failed to change language",
      );
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Select
      value={locale}
      onValueChange={handleLocaleChange}
      disabled={isChanging}
      data-testid="language-switcher"
    >
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
  const [isChanging, setIsChanging] = useState(false);

  const toggleLocale = async () => {
    if (isChanging) return;

    const newLocale = locale === "ja" ? "en" : "ja";

    try {
      setIsChanging(true);
      // Set the locale cookie using server action
      await setLocale(newLocale);

      // Refresh the page to apply the new locale
      router.refresh();
    } catch (error) {
      console.error("Failed to change locale:", error);
      // Show error to user
      alert(
        locale === "ja"
          ? "言語の変更に失敗しました"
          : "Failed to change language",
      );
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      disabled={isChanging}
      className="flex items-center gap-2"
      data-testid="language-switcher-button"
    >
      <Globe className="h-4 w-4" />
      <span>{locale === "ja" ? "EN" : "日本語"}</span>
    </Button>
  );
}
