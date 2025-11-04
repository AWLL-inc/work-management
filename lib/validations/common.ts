import { z } from "zod";

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid();

/**
 * Validation result
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

/**
 * Validate UUID format
 * @param value - The value to validate
 * @param fieldName - The name of the field (for error messages)
 * @returns ValidationResult object with valid flag and optional error message
 */
export function validateUUID(
  value: string | undefined,
  fieldName: string,
): ValidationResult {
  if (!value || value.trim() === "") {
    return {
      valid: false,
      message: `${fieldName}を選択してください`,
    };
  }

  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    return {
      valid: false,
      message: `有効な${fieldName}を選択してください`,
    };
  }

  return { valid: true };
}
