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
  TranslationKeyConstant,
} from "./types";

// Export constants and utilities
export {
  isTranslationKey,
  TRANSLATION_KEYS,
  translationKey,
} from "./types";

// Export hooks (client-side only)
export {
  useHasTranslation,
  useMultipleTranslations,
  useNamespacedTranslations,
  useTranslation,
  useTypedTranslations,
} from "./use-typed-translations";
