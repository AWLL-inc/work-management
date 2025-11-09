import { describe, expect, it } from "vitest";
import {
  generateResetToken,
  generateSecurePassword,
  hashPassword,
  hashResetToken,
  validatePasswordStrength,
  verifyPassword,
  verifyResetToken,
} from "../password";

describe("Password Utilities", () => {
  describe("generateSecurePassword", () => {
    it("should generate password with default length 16", () => {
      const password = generateSecurePassword();
      expect(password).toHaveLength(16);
    });

    it("should generate password with custom length", () => {
      const password = generateSecurePassword(24);
      expect(password).toHaveLength(24);
    });

    it("should contain uppercase, lowercase, numbers, and symbols", () => {
      const password = generateSecurePassword(16);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/);
    });

    it("should generate different passwords each time", () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      expect(password1).not.toBe(password2);
    });
  });

  describe("validatePasswordStrength", () => {
    it("should reject password shorter than 8 characters", () => {
      const result = validatePasswordStrength("Short1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long",
      );
    });

    it("should reject password without uppercase letter", () => {
      const result = validatePasswordStrength("lowercase123");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter",
      );
    });

    it("should reject password without lowercase letter", () => {
      const result = validatePasswordStrength("UPPERCASE123");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter",
      );
    });

    it("should reject password without number", () => {
      const result = validatePasswordStrength("NoNumbersHere");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number",
      );
    });

    it("should reject common passwords", () => {
      const commonPasswords = [
        "password",
        "password123",
        "123456",
        "qwerty123",
      ];

      for (const password of commonPasswords) {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password is too common and easy to guess",
        );
      }
    });

    it("should accept strong password", () => {
      const result = validatePasswordStrength("StrongPass123!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it("should provide suggestions for weak passwords", () => {
      const result = validatePasswordStrength("weak");
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("should calculate different scores for different password strengths", () => {
      const weak = validatePasswordStrength("Short1A");
      const medium = validatePasswordStrength("MediumPass1");
      const strong = validatePasswordStrength("VeryStr0ng!P@ssw0rd");

      expect(weak.score).toBeLessThan(medium.score);
      expect(medium.score).toBeLessThanOrEqual(strong.score);
    });
  });

  describe("hashPassword and verifyPassword", () => {
    it("should hash password correctly", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt format
    });

    it("should verify correct password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("WrongPassword123!", hash);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("generateResetToken", () => {
    it("should generate a token", () => {
      const token = generateResetToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate different tokens each time", () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();
      expect(token1).not.toBe(token2);
    });

    it("should generate URL-safe tokens", () => {
      const token = generateResetToken();
      // Should only contain base64url characters
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("hashResetToken", () => {
    it("should hash token correctly", () => {
      const token = "test-token-12345";
      const hash = hashResetToken(token);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(token);
      expect(hash.length).toBe(64); // SHA256 produces 64 hex characters
    });

    it("should generate same hash for same token", () => {
      const token = "test-token-12345";
      const hash1 = hashResetToken(token);
      const hash2 = hashResetToken(token);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hashes for different tokens", () => {
      const hash1 = hashResetToken("token-1");
      const hash2 = hashResetToken("token-2");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyResetToken", () => {
    it("should verify valid token", () => {
      const token = generateResetToken();
      const hashedToken = hashResetToken(token);

      const result = verifyResetToken(token, hashedToken);
      expect(result).toBe(true);
    });

    it("should reject token with mismatched hash", () => {
      const token = generateResetToken();
      const wrongHash = hashResetToken("different-token");

      const result = verifyResetToken(token, wrongHash);
      expect(result).toBe(false);
    });

    it("should verify same token consistently", () => {
      const token = generateResetToken();
      const hashedToken = hashResetToken(token);

      const result1 = verifyResetToken(token, hashedToken);
      const result2 = verifyResetToken(token, hashedToken);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result1).toBe(result2);
    });
  });
});
