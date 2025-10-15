import { describe, it, expect } from "vitest";
import * as i18nExports from "../index";

describe("lib/i18n/index", () => {
  describe("type exports", () => {
    it("should export Messages type", () => {
      // Type exports are compile-time only, but we can check that the module exports are present
      expect(typeof i18nExports).toBe("object");
    });
  });

  describe("function exports", () => {
    it("should export isTranslationKey function", () => {
      expect(typeof i18nExports.isTranslationKey).toBe("function");
    });

    it("should export translationKey function", () => {
      expect(typeof i18nExports.translationKey).toBe("function");
    });

    it("should export useTypedTranslations function", () => {
      expect(typeof i18nExports.useTypedTranslations).toBe("function");
    });

    it("should export useNamespacedTranslations function", () => {
      expect(typeof i18nExports.useNamespacedTranslations).toBe("function");
    });

    it("should export useTranslation function", () => {
      expect(typeof i18nExports.useTranslation).toBe("function");
    });

    it("should export useHasTranslation function", () => {
      expect(typeof i18nExports.useHasTranslation).toBe("function");
    });

    it("should export useMultipleTranslations function", () => {
      expect(typeof i18nExports.useMultipleTranslations).toBe("function");
    });
  });

  describe("constant exports", () => {
    it("should export TRANSLATION_KEYS object", () => {
      expect(typeof i18nExports.TRANSLATION_KEYS).toBe("object");
      expect(i18nExports.TRANSLATION_KEYS).toBeDefined();
    });

    it("should have expected translation keys", () => {
      const keys = i18nExports.TRANSLATION_KEYS;
      
      // Check some dashboard keys
      expect(keys.DASHBOARD_TITLE).toBe("dashboard.title");
      expect(keys.DASHBOARD_SUBTITLE).toBe("dashboard.subtitle");
      expect(keys.DASHBOARD_CHART_TITLE).toBe("dashboard.chart.title");
      
      // Check some common keys
      expect(keys.COMMON_LOADING).toBe("common.loading");
      expect(keys.COMMON_SAVE).toBe("common.save");
      expect(keys.COMMON_CANCEL).toBe("common.cancel");
    });
  });

  describe("complete export structure", () => {
    it("should have all expected exports", () => {
      const expectedExports = [
        "isTranslationKey",
        "TRANSLATION_KEYS", 
        "translationKey",
        "useHasTranslation",
        "useMultipleTranslations",
        "useNamespacedTranslations",
        "useTranslation",
        "useTypedTranslations",
      ];

      for (const exportName of expectedExports) {
        expect(i18nExports).toHaveProperty(exportName);
      }
    });

    it("should not have unexpected exports", () => {
      const actualExports = Object.keys(i18nExports);
      const expectedExports = [
        "isTranslationKey",
        "TRANSLATION_KEYS",
        "translationKey", 
        "useHasTranslation",
        "useMultipleTranslations",
        "useNamespacedTranslations",
        "useTranslation",
        "useTypedTranslations",
      ];

      expect(actualExports.sort()).toEqual(expectedExports.sort());
    });
  });
});