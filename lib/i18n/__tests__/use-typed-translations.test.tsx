import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useTypedTranslations,
  useNamespacedTranslations,
  useTranslation,
  useHasTranslation,
  useMultipleTranslations,
} from "../use-typed-translations";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

import { useTranslations } from "next-intl";

describe("lib/i18n/use-typed-translations", () => {
  const mockTranslationFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslations).mockReturnValue(mockTranslationFunction);
  });

  describe("useTypedTranslations", () => {
    it("should return the translation function from next-intl", () => {
      const { result } = renderHook(() => useTypedTranslations());

      expect(useTranslations).toHaveBeenCalledWith();
      expect(result.current).toBe(mockTranslationFunction);
    });

    it("should call useTranslations without parameters", () => {
      renderHook(() => useTypedTranslations());

      expect(useTranslations).toHaveBeenCalledTimes(1);
      expect(useTranslations).toHaveBeenCalledWith();
    });
  });

  describe("useNamespacedTranslations", () => {
    it("should return the translation function with namespace", () => {
      const namespace = "dashboard";
      const { result } = renderHook(() => useNamespacedTranslations(namespace));

      expect(useTranslations).toHaveBeenCalledWith(namespace);
      expect(result.current).toBe(mockTranslationFunction);
    });

    it("should work with different namespaces", () => {
      const namespaces = ["dashboard", "common", "auth"];

      namespaces.forEach(namespace => {
        vi.clearAllMocks();
        renderHook(() => useNamespacedTranslations(namespace));
        expect(useTranslations).toHaveBeenCalledWith(namespace);
      });
    });

    it("should work with empty namespace", () => {
      const { result } = renderHook(() => useNamespacedTranslations(""));

      expect(useTranslations).toHaveBeenCalledWith("");
      expect(result.current).toBe(mockTranslationFunction);
    });
  });

  describe("useTranslation", () => {
    it("should return translated string for a key", () => {
      const key = "dashboard.title";
      const translatedValue = "ダッシュボード";
      
      mockTranslationFunction.mockReturnValue(translatedValue);

      const { result } = renderHook(() => useTranslation(key));

      expect(useTranslations).toHaveBeenCalledWith();
      expect(mockTranslationFunction).toHaveBeenCalledWith(key);
      expect(result.current).toBe(translatedValue);
    });

    it("should work with nested keys", () => {
      const key = "dashboard.chart.title";
      const translatedValue = "チャートタイトル";
      
      mockTranslationFunction.mockReturnValue(translatedValue);

      const { result } = renderHook(() => useTranslation(key));

      expect(mockTranslationFunction).toHaveBeenCalledWith(key);
      expect(result.current).toBe(translatedValue);
    });

    it("should handle different key types", () => {
      const keys = [
        "common.loading",
        "dashboard.filters.startDate",
        "auth.login.submit",
      ];

      keys.forEach((key, index) => {
        const translatedValue = `Translation ${index}`;
        mockTranslationFunction.mockReturnValue(translatedValue);

        const { result } = renderHook(() => useTranslation(key));
        expect(result.current).toBe(translatedValue);
      });
    });
  });

  describe("useHasTranslation", () => {
    it("should return true when translation exists", () => {
      const key = "dashboard.title";
      const translatedValue = "ダッシュボード";
      
      mockTranslationFunction.mockReturnValue(translatedValue);

      const { result } = renderHook(() => useHasTranslation(key));

      expect(mockTranslationFunction).toHaveBeenCalledWith(key);
      expect(result.current).toBe(true);
    });

    it("should return false when translation returns the key itself", () => {
      const key = "nonexistent.key";
      
      mockTranslationFunction.mockReturnValue(key);

      const { result } = renderHook(() => useHasTranslation(key));

      expect(result.current).toBe(false);
    });

    it("should return false when translation returns bracketed key", () => {
      const key = "another.nonexistent.key";
      
      mockTranslationFunction.mockReturnValue(`[${key}]`);

      const { result } = renderHook(() => useHasTranslation(key));

      expect(result.current).toBe(false);
    });

    it("should return false when translation function throws", () => {
      const key = "error.key";
      
      mockTranslationFunction.mockImplementation(() => {
        throw new Error("Translation error");
      });

      const { result } = renderHook(() => useHasTranslation(key));

      expect(result.current).toBe(false);
    });

    it("should handle edge cases", () => {
      const testCases = [
        { key: "valid.key", translation: "Valid Translation", expected: true },
        { key: "invalid.key", translation: "invalid.key", expected: false },
        { key: "missing.key", translation: "[missing.key]", expected: false },
        { key: "empty.key", translation: "", expected: true }, // Empty string is different from key
        { key: "space.key", translation: " ", expected: true }, // Space is different from key
      ];

      testCases.forEach(({ key, translation, expected }) => {
        mockTranslationFunction.mockReturnValue(translation);
        
        const { result } = renderHook(() => useHasTranslation(key));
        expect(result.current).toBe(expected);
      });
    });
  });

  describe("useMultipleTranslations", () => {
    it("should return translations for multiple keys", () => {
      const keys = {
        title: "dashboard.title",
        subtitle: "dashboard.subtitle",
        loading: "common.loading",
      };

      const translations = {
        "dashboard.title": "ダッシュボード",
        "dashboard.subtitle": "サブタイトル",
        "common.loading": "読み込み中",
      };

      mockTranslationFunction.mockImplementation((key: string) => translations[key]);

      const { result } = renderHook(() => useMultipleTranslations(keys));

      expect(result.current).toEqual({
        title: "ダッシュボード",
        subtitle: "サブタイトル",
        loading: "読み込み中",
      });

      // Verify all keys were called
      expect(mockTranslationFunction).toHaveBeenCalledTimes(3);
      expect(mockTranslationFunction).toHaveBeenCalledWith("dashboard.title");
      expect(mockTranslationFunction).toHaveBeenCalledWith("dashboard.subtitle");
      expect(mockTranslationFunction).toHaveBeenCalledWith("common.loading");
    });

    it("should handle empty keys object", () => {
      const { result } = renderHook(() => useMultipleTranslations({}));

      expect(result.current).toEqual({});
      expect(mockTranslationFunction).not.toHaveBeenCalled();
    });

    it("should handle single key", () => {
      const keys = {
        title: "dashboard.title",
      };

      mockTranslationFunction.mockReturnValue("ダッシュボード");

      const { result } = renderHook(() => useMultipleTranslations(keys));

      expect(result.current).toEqual({
        title: "ダッシュボード",
      });

      expect(mockTranslationFunction).toHaveBeenCalledTimes(1);
      expect(mockTranslationFunction).toHaveBeenCalledWith("dashboard.title");
    });

    it("should preserve key names in result", () => {
      const keys = {
        customTitle: "dashboard.title",
        customSubtitle: "dashboard.subtitle",
        customLoading: "common.loading",
      };

      mockTranslationFunction.mockImplementation((key: string) => `Translation for ${key}`);

      const { result } = renderHook(() => useMultipleTranslations(keys));

      expect(result.current).toEqual({
        customTitle: "Translation for dashboard.title",
        customSubtitle: "Translation for dashboard.subtitle",
        customLoading: "Translation for common.loading",
      });
    });

    it("should handle complex key structures", () => {
      const keys = {
        "nested-key": "dashboard.chart.title",
        "another_key": "common.error.message",
        "key123": "auth.login.submit",
      };

      mockTranslationFunction.mockImplementation((key: string) => `Translated: ${key}`);

      const { result } = renderHook(() => useMultipleTranslations(keys));

      expect(result.current).toEqual({
        "nested-key": "Translated: dashboard.chart.title",
        "another_key": "Translated: common.error.message",
        "key123": "Translated: auth.login.submit",
      });
    });

    it("should call useTranslations once regardless of number of keys", () => {
      const keys = {
        a: "key.a",
        b: "key.b",
        c: "key.c",
        d: "key.d",
        e: "key.e",
      };

      mockTranslationFunction.mockReturnValue("translation");

      renderHook(() => useMultipleTranslations(keys));

      expect(useTranslations).toHaveBeenCalledTimes(1);
      expect(mockTranslationFunction).toHaveBeenCalledTimes(5);
    });
  });

  describe("integration behavior", () => {
    it("should all use the same useTranslations hook", () => {
      renderHook(() => {
        useTypedTranslations();
        useTranslation("test.key");
        useHasTranslation("test.key");
        useMultipleTranslations({ key: "test.key" });
      });

      // Each hook should call useTranslations once
      expect(useTranslations).toHaveBeenCalledTimes(4);
    });

    it("should handle namespaced and non-namespaced calls differently", () => {
      renderHook(() => {
        useTypedTranslations(); // No namespace
        useNamespacedTranslations("dashboard"); // With namespace
      });

      expect(useTranslations).toHaveBeenNthCalledWith(1);
      expect(useTranslations).toHaveBeenNthCalledWith(2, "dashboard");
    });
  });
});