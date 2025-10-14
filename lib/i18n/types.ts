/**
 * Type-safe translation keys for i18n
 * 
 * This module provides TypeScript types for translation keys,
 * ensuring compile-time safety when using translations.
 */

import type jaMessages from "@/messages/ja.json";

// Use Japanese messages as the source of truth for types
export type Messages = typeof jaMessages;

/**
 * Recursively generate dot-notation keys from nested object
 * Example: { dashboard: { title: "..." } } -> "dashboard.title"
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & string];

/**
 * Type-safe translation keys
 * All possible translation keys in dot notation
 */
export type TranslationKey = NestedKeyOf<Messages>;

/**
 * Extract the parameters from a translation message
 * Example: "Hello {name}" -> { name: string }
 */
type ExtractParams<T extends string> = T extends `${string}{${infer Param}}${infer Rest}`
  ? { [K in Param]: string | number } & ExtractParams<Rest>
  : {};

/**
 * Get the type of parameters for a specific translation key
 */
export type TranslationParams<Key extends TranslationKey> = Key extends keyof Messages
  ? Messages[Key] extends string
    ? ExtractParams<Messages[Key]>
    : Key extends `${infer Parent}.${infer Child}`
    ? Parent extends keyof Messages
      ? Messages[Parent] extends object
        ? Child extends NestedKeyOf<Messages[Parent]>
          ? ExtractMessageParams<Messages[Parent], Child>
          : never
        : never
      : never
    : never
  : never;

/**
 * Helper type to extract params from nested messages
 */
type ExtractMessageParams<
  Obj extends object,
  Path extends string
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof Obj
    ? Obj[Key] extends object
      ? ExtractMessageParams<Obj[Key], Rest>
      : never
    : never
  : Path extends keyof Obj
  ? Obj[Path] extends string
    ? ExtractParams<Obj[Path]>
    : never
  : never;

/**
 * Type guard to check if a string is a valid translation key
 */
export function isTranslationKey(key: string): key is TranslationKey {
  // This is a runtime check - in practice, you'd validate against actual keys
  return typeof key === 'string' && key.includes('.');
}

/**
 * Helper function to create type-safe translation keys
 * This provides better IntelliSense support
 */
export function translationKey<K extends TranslationKey>(key: K): K {
  return key;
}

/**
 * Type-safe translation hook return type
 */
export interface TypedTranslations {
  <K extends TranslationKey>(
    key: K,
    ...args: keyof TranslationParams<K> extends never
      ? []
      : [params: TranslationParams<K>]
  ): string;
  rich: <K extends TranslationKey>(
    key: K,
    ...args: keyof TranslationParams<K> extends never
      ? []
      : [params: TranslationParams<K>]
  ) => React.ReactNode;
}

/**
 * Namespace-specific translation type
 */
export type NamespaceTranslations<Namespace extends keyof Messages> = {
  <K extends NestedKeyOf<Messages[Namespace]>>(
    key: K,
    ...args: keyof ExtractMessageParams<Messages[Namespace], K> extends never
      ? []
      : [params: ExtractMessageParams<Messages[Namespace], K>]
  ): string;
  rich: <K extends NestedKeyOf<Messages[Namespace]>>(
    key: K,
    ...args: keyof ExtractMessageParams<Messages[Namespace], K> extends never
      ? []
      : [params: ExtractMessageParams<Messages[Namespace], K>]
  ) => React.ReactNode;
};

/**
 * Export commonly used translation keys as constants
 * This provides even better type safety and IntelliSense
 */
export const TRANSLATION_KEYS = {
  // Dashboard
  DASHBOARD_TITLE: 'dashboard.title' as const,
  DASHBOARD_SUBTITLE: 'dashboard.subtitle' as const,
  DASHBOARD_FILTERS_VIEW_METHOD: 'dashboard.filters.viewMethod' as const,
  DASHBOARD_FILTERS_PERIOD_SELECTION: 'dashboard.filters.periodSelection' as const,
  DASHBOARD_FILTERS_START_DATE: 'dashboard.filters.startDate' as const,
  DASHBOARD_FILTERS_END_DATE: 'dashboard.filters.endDate' as const,
  DASHBOARD_FILTERS_RESET: 'dashboard.filters.reset' as const,
  DASHBOARD_FILTERS_APPLY: 'dashboard.filters.apply' as const,
  DASHBOARD_FILTERS_LOADING: 'dashboard.filters.loading' as const,
  DASHBOARD_USER_VIEW: 'dashboard.userView' as const,
  DASHBOARD_PROJECT_VIEW: 'dashboard.projectView' as const,
  DASHBOARD_CHART_TITLE: 'dashboard.chart.title' as const,
  DASHBOARD_CHART_BY_USER: 'dashboard.chart.byUser' as const,
  DASHBOARD_CHART_BY_PROJECT: 'dashboard.chart.byProject' as const,
  DASHBOARD_CHART_NO_DATA: 'dashboard.chart.noData' as const,
  DASHBOARD_CHART_LOADING: 'dashboard.chart.loading' as const,
  
  // Common
  COMMON_LOADING: 'common.loading' as const,
  COMMON_ERROR: 'common.error' as const,
  COMMON_SUCCESS: 'common.success' as const,
  COMMON_CANCEL: 'common.cancel' as const,
  COMMON_SAVE: 'common.save' as const,
  COMMON_DELETE: 'common.delete' as const,
  COMMON_EDIT: 'common.edit' as const,
  COMMON_ADD: 'common.add' as const,
  COMMON_SEARCH: 'common.search' as const,
  COMMON_FILTER: 'common.filter' as const,
  COMMON_SORT: 'common.sort' as const,
  COMMON_EXPORT: 'common.export' as const,
  COMMON_IMPORT: 'common.import' as const,
} as const;

/**
 * Type for the TRANSLATION_KEYS values
 */
export type TranslationKeyConstant = typeof TRANSLATION_KEYS[keyof typeof TRANSLATION_KEYS];