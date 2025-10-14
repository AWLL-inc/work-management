/**
 * Type-safe wrapper for next-intl translations
 * 
 * This module provides a typed version of useTranslations hook
 * that ensures compile-time safety for translation keys.
 */

"use client";

import { useTranslations } from "next-intl";
import type { Messages, TranslationKey, TypedTranslations, NamespaceTranslations } from "./types";

/**
 * Type-safe version of useTranslations hook
 * 
 * @example
 * ```tsx
 * const t = useTypedTranslations();
 * const title = t("dashboard.title");
 * const greeting = t("common.greeting", { name: "John" });
 * ```
 */
export function useTypedTranslations(): TypedTranslations {
  const t = useTranslations();
  
  // Cast to TypedTranslations for type safety
  // The actual runtime behavior is handled by next-intl
  return t as unknown as TypedTranslations;
}

/**
 * Type-safe version of useTranslations hook with namespace
 * 
 * @example
 * ```tsx
 * const t = useTypedTranslations("dashboard");
 * const title = t("title"); // dashboard.title
 * const chartTitle = t("chart.title"); // dashboard.chart.title
 * ```
 */
export function useNamespacedTranslations<Namespace extends keyof Messages>(
  namespace: Namespace
): NamespaceTranslations<Namespace> {
  const t = useTranslations(namespace);
  
  // Cast to NamespaceTranslations for type safety
  return t as unknown as NamespaceTranslations<Namespace>;
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
export function useTranslation<K extends TranslationKey>(key: K): string {
  const t = useTypedTranslations();
  // Split the key to handle namespace
  const parts = key.split('.');
  if (parts.length > 1) {
    const namespace = parts[0];
    const subKey = parts.slice(1).join('.');
    const namespacedT = useTranslations(namespace);
    return namespacedT(subKey);
  }
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
export function useHasTranslation(key: TranslationKey): boolean {
  try {
    const t = useTypedTranslations();
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
 * const texts = useTranslations({
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
export function useMultipleTranslations<
  T extends Record<string, TranslationKey>
>(keys: T): { [K in keyof T]: string } {
  const t = useTypedTranslations();
  
  const result = {} as { [K in keyof T]: string };
  for (const [name, key] of Object.entries(keys)) {
    result[name as keyof T] = t(key as TranslationKey);
  }
  
  return result;
}