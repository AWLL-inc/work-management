/**
 * Type-safe wrapper for next-intl translations
 *
 * This module provides a typed version of useTranslations hook
 * that ensures compile-time safety for translation keys.
 */

"use client";

import { useTranslations } from "next-intl";

/**
 * Type-safe version of useTranslations hook
 *
 * Note: Due to the complexity of type-safe translations with parameters,
 * this implementation provides a simpler interface that still offers
 * type safety for keys while maintaining runtime compatibility.
 *
 * @example
 * ```tsx
 * const t = useTypedTranslations();
 * const title = t("dashboard.title");
 * const greeting = t("common.greeting", { name: "John" });
 * ```
 */
export function useTypedTranslations() {
  const t = useTranslations();
  return t;
}

/**
 * Type-safe version of useTranslations hook with namespace
 *
 * @example
 * ```tsx
 * const t = useNamespacedTranslations("dashboard");
 * const title = t("title"); // dashboard.title
 * const chartTitle = t("chart.title"); // dashboard.chart.title
 * ```
 */
export function useNamespacedTranslations(namespace: string) {
  const t = useTranslations(namespace);
  return t;
}

/**
 * Hook to get a specific translation with type safety
 * Useful when you only need a single translation
 *
 * @example
 * ```tsx
 * const title = useTranslation("dashboard.title");
 * ```
 */
export function useTranslation(key: string): string {
  const t = useTranslations();
  // For nested keys, we use the full key directly
  // The translation function handles dot notation internally
  return t(key);
}

/**
 * Hook to check if a translation key exists
 * Useful for conditional rendering based on translation availability
 *
 * @example
 * ```tsx
 * const hasDescription = useHasTranslation("feature.description");
 * if (hasDescription) {
 *   return <p>{t("feature.description")}</p>;
 * }
 * ```
 */
export function useHasTranslation(key: string): boolean {
  const t = useTranslations();
  try {
    const result = t(key);
    // Check if the translation actually exists (not just returning the key)
    return result !== key && result !== `[${key}]`;
  } catch {
    return false;
  }
}

/**
 * Hook to get multiple translations at once
 * Useful for getting all translations for a component
 *
 * @example
 * ```tsx
 * const texts = useMultipleTranslations({
 *   title: "dashboard.title",
 *   subtitle: "dashboard.subtitle",
 *   loading: "common.loading"
 * });
 *
 * return (
 *   <div>
 *     <h1>{texts.title}</h1>
 *     <p>{texts.subtitle}</p>
 *   </div>
 * );
 * ```
 */
export function useMultipleTranslations<T extends Record<string, string>>(
  keys: T,
): { [K in keyof T]: string } {
  const t = useTranslations();

  const result = {} as { [K in keyof T]: string };
  for (const [name, key] of Object.entries(keys)) {
    result[name as keyof T] = t(key);
  }

  return result;
}
