/**
 * Work Log Validation Utilities
 *
 * Centralized validation functions for work log data.
 * These functions are used across multiple components to ensure consistent validation.
 *
 * @module lib/validations/work-log-validations
 */

import { parseDate } from "@/lib/utils";
import { WORK_LOG_CONSTRAINTS } from "@/lib/validations";

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates work log hours value
 *
 * @param value - The hours value to validate (as string from form/grid)
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateHours("8.5");
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 * ```
 */
export function validateHours(value: string): ValidationResult {
  if (!value) {
    return { valid: false, message: "時間を入力してください" };
  }

  if (!WORK_LOG_CONSTRAINTS.HOURS.PATTERN.test(value)) {
    return {
      valid: false,
      message: "数値で入力してください（例: 8 または 8.5）",
    };
  }

  const hours = parseFloat(value);

  if (hours <= WORK_LOG_CONSTRAINTS.HOURS.MIN) {
    return { valid: false, message: "0より大きい値を入力してください" };
  }

  if (hours > WORK_LOG_CONSTRAINTS.HOURS.MAX) {
    return { valid: false, message: "168以下で入力してください" };
  }

  return { valid: true };
}

/**
 * Validates work log date value
 *
 * @param value - The date value to validate (YYYY-MM-DD format)
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateDate("2025-10-15");
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 * ```
 */
export function validateDate(value: string): ValidationResult {
  if (!value) {
    return { valid: false, message: "日付を入力してください" };
  }

  const date = parseDate(value);
  if (!date) {
    return {
      valid: false,
      message: "有効な日付をYYYY-MM-DD形式で入力してください",
    };
  }

  return { valid: true };
}

/**
 * Validates work log details value
 *
 * @param value - The details value to validate
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateDetails("Project work details");
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 * ```
 */
export function validateDetails(
  value: string | null | undefined,
): ValidationResult {
  // Details is optional, empty is valid
  if (!value) {
    return { valid: true };
  }

  if (value.length > WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH) {
    return {
      valid: false,
      message: `詳細は${WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH}文字以下で入力してください`,
    };
  }

  return { valid: true };
}

/**
 * Validates project ID value
 *
 * @param value - The project ID to validate (UUID format)
 * @returns Validation result with valid flag and optional error message
 */
export function validateProjectId(
  value: string | null | undefined,
): ValidationResult {
  if (!value || value.trim() === "") {
    return { valid: false, message: "プロジェクトを選択してください" };
  }

  // Check if it's a valid UUID format (basic check)
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(value)) {
    return { valid: false, message: "有効なプロジェクトを選択してください" };
  }

  return { valid: true };
}

/**
 * Validates category ID value
 *
 * @param value - The category ID to validate (UUID format)
 * @returns Validation result with valid flag and optional error message
 */
export function validateCategoryId(
  value: string | null | undefined,
): ValidationResult {
  if (!value || value.trim() === "") {
    return { valid: false, message: "カテゴリを選択してください" };
  }

  // Check if it's a valid UUID format (basic check)
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(value)) {
    return { valid: false, message: "有効なカテゴリを選択してください" };
  }

  return { valid: true };
}

/**
 * Validates all work log fields at once
 *
 * @param data - Partial work log data to validate
 * @returns Array of validation error messages (empty if all valid)
 *
 * @example
 * ```typescript
 * const errors = validateWorkLogData({
 *   date: "2025-10-15",
 *   hours: "8",
 *   projectId: "uuid",
 *   categoryId: "uuid"
 * });
 *
 * if (errors.length > 0) {
 *   console.error("Validation errors:", errors);
 * }
 * ```
 */
export function validateWorkLogData(data: {
  date?: string | Date;
  hours?: string;
  projectId?: string;
  categoryId?: string;
  details?: string | null;
}): string[] {
  const errors: string[] = [];

  // Validate date
  if (data.date !== undefined) {
    const dateStr =
      typeof data.date === "string"
        ? data.date
        : data.date?.toISOString().split("T")[0];

    if (dateStr) {
      const dateValidation = validateDate(dateStr);
      if (!dateValidation.valid && dateValidation.message) {
        errors.push(dateValidation.message);
      }
    }
  }

  // Validate hours
  if (data.hours !== undefined) {
    const hoursValidation = validateHours(data.hours);
    if (!hoursValidation.valid && hoursValidation.message) {
      errors.push(hoursValidation.message);
    }
  }

  // Validate project ID
  if (data.projectId !== undefined) {
    const projectValidation = validateProjectId(data.projectId);
    if (!projectValidation.valid && projectValidation.message) {
      errors.push(projectValidation.message);
    }
  }

  // Validate category ID
  if (data.categoryId !== undefined) {
    const categoryValidation = validateCategoryId(data.categoryId);
    if (!categoryValidation.valid && categoryValidation.message) {
      errors.push(categoryValidation.message);
    }
  }

  // Validate details
  if (data.details !== undefined) {
    const detailsValidation = validateDetails(data.details);
    if (!detailsValidation.valid && detailsValidation.message) {
      errors.push(detailsValidation.message);
    }
  }

  return errors;
}
