import crypto from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * Password strength validation result
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4 (weak to strong)
  errors: string[];
  suggestions: string[];
}

/**
 * Generate a secure random password
 * @param length Password length (default: 16)
 * @returns Secure password with mixed characters
 */
export function generateSecurePassword(length = 16): string {
  // Character sets
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";

  // Ensure at least one character from each category
  let password = "";
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill remaining length with random characters from all sets
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle password to randomize character positions
  return password
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
}

/**
 * Validate password strength
 * @param password Password to validate
 * @returns Validation result with score and suggestions
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    score += 1;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    score += 1;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    score += 1;
  }

  // Check for special characters (optional but recommended)
  if (!/[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(password)) {
    suggestions.push(
      "Consider adding special characters for stronger security",
    );
  } else {
    score += 1;
  }

  // Check for common passwords
  const commonPasswords = [
    "password",
    "password123",
    "123456",
    "12345678",
    "qwerty",
    "abc123",
    "monkey",
    "letmein",
    "trustno1",
    "dragon",
  ];

  if (
    commonPasswords.some((common) =>
      password.toLowerCase().includes(common.toLowerCase()),
    )
  ) {
    errors.push("Password is too common and easy to guess");
    score = Math.max(0, score - 2);
  }

  // Normalize score to 0-4 range
  score = Math.min(4, score);

  return {
    isValid: errors.length === 0,
    score,
    errors,
    suggestions,
  };
}

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token for password reset
 * @returns Secure random token (32 bytes hex)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a reset token for database storage
 * @param token Plain text token
 * @returns Hashed token
 */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a reset token against its hash
 * @param token Plain text token
 * @param hash Hashed token
 * @returns True if token matches hash
 */
export function verifyResetToken(token: string, hash: string): boolean {
  const hashedToken = hashResetToken(token);
  return hashedToken === hash;
}
