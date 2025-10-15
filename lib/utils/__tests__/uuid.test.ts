import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateUuid } from "../uuid";

describe("lib/utils/uuid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateUuid", () => {
    it("should generate a valid UUID v4 format", () => {
      const uuid = generateUuid();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it("should generate unique UUIDs", () => {
      const uuids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        const uuid = generateUuid();
        expect(uuids.has(uuid)).toBe(false);
        uuids.add(uuid);
      }

      expect(uuids.size).toBe(count);
    });

    it("should always have 4 as the version identifier", () => {
      for (let i = 0; i < 100; i++) {
        const uuid = generateUuid();
        const versionChar = uuid.charAt(14); // 15th character (0-indexed) is the version
        expect(versionChar).toBe("4");
      }
    });

    it("should have correct variant bits in the variant field", () => {
      for (let i = 0; i < 100; i++) {
        const uuid = generateUuid();
        const variantChar = uuid.charAt(19); // 20th character is the variant
        // Variant should be 8, 9, a, or b (binary 10xx)
        expect(["8", "9", "a", "b"]).toContain(variantChar.toLowerCase());
      }
    });

    it("should use crypto.randomUUID when available", () => {
      const mockRandomUUID = vi.fn().mockReturnValue("550e8400-e29b-41d4-a716-446655440000");
      
      // Mock crypto object
      const originalCrypto = global.crypto;
      Object.defineProperty(global, "crypto", {
        value: {
          ...originalCrypto,
          randomUUID: mockRandomUUID,
        },
        configurable: true,
      });

      const uuid = generateUuid();

      expect(mockRandomUUID).toHaveBeenCalledTimes(1);
      expect(uuid).toBe("550e8400-e29b-41d4-a716-446655440000");

      // Restore original crypto
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });

    it("should use fallback when crypto.randomUUID is not available", () => {
      const originalCrypto = global.crypto;
      
      // Mock crypto as undefined
      Object.defineProperty(global, "crypto", {
        value: undefined,
        configurable: true,
      });

      const uuid = generateUuid();

      // Should still generate a valid UUID using fallback
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);

      // Restore original crypto
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });

    it("should use fallback when crypto exists but randomUUID is not available", () => {
      const originalCrypto = global.crypto;
      
      // Mock crypto without randomUUID
      Object.defineProperty(global, "crypto", {
        value: {} as Crypto,
        configurable: true,
      });

      const uuid = generateUuid();

      // Should still generate a valid UUID using fallback
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);

      // Restore original crypto
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });

    it("should generate different UUIDs with fallback method", () => {
      const originalCrypto = global.crypto;
      
      // Mock crypto as undefined to force fallback
      Object.defineProperty(global, "crypto", {
        value: undefined,
        configurable: true,
      });

      const uuid1 = generateUuid();
      const uuid2 = generateUuid();
      const uuid3 = generateUuid();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);

      // All should be valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid1).toMatch(uuidRegex);
      expect(uuid2).toMatch(uuidRegex);
      expect(uuid3).toMatch(uuidRegex);

      // Restore original crypto
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });

    it("should handle Math.random edge cases in fallback", () => {
      const originalCrypto = global.crypto;
      const originalMathRandom = Math.random;
      
      // Mock crypto as undefined to force fallback
      Object.defineProperty(global, "crypto", {
        value: undefined,
        configurable: true,
      });

      // Test with Math.random returning 0
      Math.random = vi.fn().mockReturnValue(0);
      const uuid1 = generateUuid();
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      // Test with Math.random returning close to 1
      Math.random = vi.fn().mockReturnValue(0.9999999);
      const uuid2 = generateUuid();
      expect(uuid2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      // Test with Math.random returning 0.5
      Math.random = vi.fn().mockReturnValue(0.5);
      const uuid3 = generateUuid();
      expect(uuid3).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      // Restore
      Math.random = originalMathRandom;
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });

    it("should generate correct length UUID", () => {
      const uuid = generateUuid();
      expect(uuid.length).toBe(36); // 32 hex chars + 4 hyphens
    });

    it("should have hyphens in correct positions", () => {
      const uuid = generateUuid();
      expect(uuid.charAt(8)).toBe("-");
      expect(uuid.charAt(13)).toBe("-");
      expect(uuid.charAt(18)).toBe("-");
      expect(uuid.charAt(23)).toBe("-");
    });

    it("should only contain valid hexadecimal characters and hyphens", () => {
      const uuid = generateUuid();
      const validChars = /^[0-9a-f-]+$/i;
      expect(uuid).toMatch(validChars);
    });

    it("should be compatible with standard UUID libraries", () => {
      const uuid = generateUuid();
      
      // Test basic UUID format that most libraries expect
      const parts = uuid.split("-");
      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[3]).toHaveLength(4);
      expect(parts[4]).toHaveLength(12);
    });

    it("should work in different environments", () => {
      // Test multiple calls to ensure consistency
      const uuids = [];
      for (let i = 0; i < 10; i++) {
        const uuid = generateUuid();
        expect(typeof uuid).toBe("string");
        expect(uuid.length).toBe(36);
        uuids.push(uuid);
      }
      
      // Ensure all are unique
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(uuids.length);
    });
  });
});