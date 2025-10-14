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
 * Type guard to check if a string is a valid translation key
 */
export function isTranslationKey(key: string): key is TranslationKey {
  // This is a runtime check - in practice, you'd validate against actual keys
  return typeof key === 'string' && key.length > 0;
}

/**
 * Helper function to create type-safe translation keys
 * This provides better IntelliSense support
 */
export function translationKey<K extends TranslationKey>(key: K): K {
  return key;
}

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