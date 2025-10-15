import { describe, expect, it } from "vitest";
import {
  isTranslationKey,
  TRANSLATION_KEYS,
  type TranslationKey,
  type TranslationKeyConstant,
  translationKey,
} from "../types";

describe("lib/i18n/types", () => {
  describe("isTranslationKey", () => {
    it("should return true for non-empty strings", () => {
      expect(isTranslationKey("dashboard.title")).toBe(true);
      expect(isTranslationKey("common.loading")).toBe(true);
      expect(isTranslationKey("a")).toBe(true);
      expect(isTranslationKey("nested.key.structure")).toBe(true);
    });

    it("should return false for empty strings", () => {
      expect(isTranslationKey("")).toBe(false);
    });

    it("should work as type guard", () => {
      const testKey: string = "dashboard.title";

      if (isTranslationKey(testKey)) {
        // TypeScript should recognize testKey as TranslationKey here
        expect(typeof testKey).toBe("string");
      }
    });

    it("should handle various string types", () => {
      expect(isTranslationKey("simple")).toBe(true);
      expect(isTranslationKey("with.dots")).toBe(true);
      expect(isTranslationKey("with-dashes")).toBe(true);
      expect(isTranslationKey("with_underscores")).toBe(true);
      expect(isTranslationKey("with123numbers")).toBe(true);
      expect(isTranslationKey("UPPERCASE")).toBe(true);
      expect(isTranslationKey("MixedCase")).toBe(true);
    });
  });

  describe("translationKey", () => {
    it("should return the same key that was passed in", () => {
      const key = "dashboard.title";
      expect(translationKey(key as TranslationKey)).toBe(key);
    });

    it("should work with nested keys", () => {
      const key = "dashboard.chart.title";
      expect(translationKey(key as TranslationKey)).toBe(key);
    });

    it("should work with common keys", () => {
      const key = "common.loading";
      expect(translationKey(key as TranslationKey)).toBe(key);
    });

    it("should preserve the exact string value", () => {
      const keys = [
        "dashboard.title",
        "dashboard.subtitle",
        "common.error",
        "common.success",
      ];

      keys.forEach((key) => {
        expect(translationKey(key as TranslationKey)).toBe(key);
      });
    });
  });

  describe("TRANSLATION_KEYS", () => {
    it("should have dashboard translation keys", () => {
      expect(TRANSLATION_KEYS.DASHBOARD_TITLE).toBe("dashboard.title");
      expect(TRANSLATION_KEYS.DASHBOARD_SUBTITLE).toBe("dashboard.subtitle");
      expect(TRANSLATION_KEYS.DASHBOARD_FILTERS_VIEW_METHOD).toBe(
        "dashboard.filters.viewMethod",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_FILTERS_PERIOD_SELECTION).toBe(
        "dashboard.filters.periodSelection",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_FILTERS_START_DATE).toBe(
        "dashboard.filters.startDate",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_FILTERS_END_DATE).toBe(
        "dashboard.filters.endDate",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_FILTERS_RESET).toBe(
        "dashboard.filters.reset",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_FILTERS_APPLY).toBe(
        "dashboard.filters.apply",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_FILTERS_LOADING).toBe(
        "dashboard.filters.loading",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_USER_VIEW).toBe("dashboard.userView");
      expect(TRANSLATION_KEYS.DASHBOARD_PROJECT_VIEW).toBe(
        "dashboard.projectView",
      );
    });

    it("should have dashboard chart translation keys", () => {
      expect(TRANSLATION_KEYS.DASHBOARD_CHART_TITLE).toBe(
        "dashboard.chart.title",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_CHART_BY_USER).toBe(
        "dashboard.chart.byUser",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_CHART_BY_PROJECT).toBe(
        "dashboard.chart.byProject",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_CHART_NO_DATA).toBe(
        "dashboard.chart.noData",
      );
      expect(TRANSLATION_KEYS.DASHBOARD_CHART_LOADING).toBe(
        "dashboard.chart.loading",
      );
    });

    it("should have common translation keys", () => {
      expect(TRANSLATION_KEYS.COMMON_LOADING).toBe("common.loading");
      expect(TRANSLATION_KEYS.COMMON_ERROR).toBe("common.error");
      expect(TRANSLATION_KEYS.COMMON_SUCCESS).toBe("common.success");
      expect(TRANSLATION_KEYS.COMMON_CANCEL).toBe("common.cancel");
      expect(TRANSLATION_KEYS.COMMON_SAVE).toBe("common.save");
      expect(TRANSLATION_KEYS.COMMON_DELETE).toBe("common.delete");
      expect(TRANSLATION_KEYS.COMMON_EDIT).toBe("common.edit");
      expect(TRANSLATION_KEYS.COMMON_ADD).toBe("common.add");
      expect(TRANSLATION_KEYS.COMMON_SEARCH).toBe("common.search");
      expect(TRANSLATION_KEYS.COMMON_FILTER).toBe("common.filter");
      expect(TRANSLATION_KEYS.COMMON_SORT).toBe("common.sort");
      expect(TRANSLATION_KEYS.COMMON_EXPORT).toBe("common.export");
      expect(TRANSLATION_KEYS.COMMON_IMPORT).toBe("common.import");
    });

    it("should have all keys as const values", () => {
      // Test that the keys are readonly by checking their types
      const dashboardTitle: "dashboard.title" =
        TRANSLATION_KEYS.DASHBOARD_TITLE;
      const commonLoading: "common.loading" = TRANSLATION_KEYS.COMMON_LOADING;

      expect(dashboardTitle).toBe("dashboard.title");
      expect(commonLoading).toBe("common.loading");
    });

    it("should have the correct number of keys", () => {
      const actualKeyCount = Object.keys(TRANSLATION_KEYS).length;

      // Check that we have a reasonable number of keys (at least 25)
      expect(actualKeyCount).toBeGreaterThanOrEqual(25);
    });

    it("should have unique values", () => {
      const values = Object.values(TRANSLATION_KEYS);
      const uniqueValues = new Set(values);

      expect(uniqueValues.size).toBe(values.length);
    });

    it("should follow naming convention", () => {
      const keys = Object.keys(TRANSLATION_KEYS);

      // All keys should be uppercase with underscores
      keys.forEach((key) => {
        expect(key).toMatch(/^[A-Z_]+$/);
      });
    });

    it("should group keys logically", () => {
      const keys = Object.keys(TRANSLATION_KEYS);

      // Dashboard keys should start with DASHBOARD_
      const dashboardKeys = keys.filter((key) => key.startsWith("DASHBOARD_"));
      expect(dashboardKeys.length).toBeGreaterThan(0);

      // Common keys should start with COMMON_
      const commonKeys = keys.filter((key) => key.startsWith("COMMON_"));
      expect(commonKeys.length).toBeGreaterThan(0);

      // All keys should belong to one of these groups
      const categorizedKeys = [...dashboardKeys, ...commonKeys];
      expect(categorizedKeys.length).toBe(keys.length);
    });
  });

  describe("type compatibility", () => {
    it("should work with TranslationKeyConstant type", () => {
      const key1: TranslationKeyConstant = TRANSLATION_KEYS.DASHBOARD_TITLE;
      const key2: TranslationKeyConstant = TRANSLATION_KEYS.COMMON_LOADING;

      expect(key1).toBe("dashboard.title");
      expect(key2).toBe("common.loading");
    });

    it("should ensure all TRANSLATION_KEYS values are valid translation keys", () => {
      Object.values(TRANSLATION_KEYS).forEach((value) => {
        expect(isTranslationKey(value)).toBe(true);
      });
    });

    it("should work with generic usage", () => {
      function useKey<T extends TranslationKeyConstant>(key: T): T {
        return key;
      }

      const result = useKey(TRANSLATION_KEYS.DASHBOARD_TITLE);
      expect(result).toBe("dashboard.title");
    });
  });
});
