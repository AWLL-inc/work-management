/**
 * i18n module exports
 * 
 * This module provides type-safe internationalization utilities
 * for the Work Management application.
 */

// Export types
export type {
  Messages,
  TranslationKey,
  TranslationParams,
  TypedTranslations,
  NamespaceTranslations,
  TranslationKeyConstant,
} from "./types";

// Export constants and utilities
export {
  TRANSLATION_KEYS,
  isTranslationKey,
  translationKey,
} from "./types";

// Export hooks (client-side only)
export {
  useTypedTranslations,
  useNamespacedTranslations,
  useTranslation,
  useHasTranslation,
  useMultipleTranslations,
} from "./use-typed-translations";