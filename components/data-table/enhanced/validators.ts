/**
 * Common validators for AG Grid columns
 *
 * Provides reusable validation functions that return structured validation results.
 * These validators can be used with the column builder's `.validator()` method.
 */

import type { ValidationResult } from "./column-builder";

/**
 * Create a required field validator
 *
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('projectId')
 *   .validator(required('Project is required'))
 *   .build();
 * ```
 */
export function required(
  message = "This field is required",
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: false, message };
    }
    return { valid: true };
  };
}

/**
 * Create a string length validator
 *
 * @param min - Minimum length
 * @param max - Maximum length
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<Project>()
 *   .field('name')
 *   .validator(stringLength(1, 100, 'Name must be 1-100 characters'))
 *   .build();
 * ```
 */
export function stringLength(
  min?: number,
  max?: number,
  message?: string,
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined) {
      return { valid: true };
    }

    const str = String(value);
    const length = str.length;

    if (min !== undefined && length < min) {
      return {
        valid: false,
        message: message || `Minimum length is ${min} characters`,
      };
    }

    if (max !== undefined && length > max) {
      return {
        valid: false,
        message: message || `Maximum length is ${max} characters`,
      };
    }

    return { valid: true };
  };
}

/**
 * Create a number range validator
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('hours')
 *   .validator(numberRange(0, 24, 'Hours must be between 0 and 24'))
 *   .build();
 * ```
 */
export function numberRange(
  min?: number,
  max?: number,
  message?: string,
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    const num = typeof value === "string" ? parseFloat(value) : Number(value);

    if (Number.isNaN(num)) {
      return { valid: false, message: "Must be a valid number" };
    }

    if (min !== undefined && num < min) {
      return {
        valid: false,
        message: message || `Minimum value is ${min}`,
      };
    }

    if (max !== undefined && num > max) {
      return {
        valid: false,
        message: message || `Maximum value is ${max}`,
      };
    }

    return { valid: true };
  };
}

/**
 * Create a pattern (regex) validator
 *
 * @param pattern - Regular expression pattern
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('hours')
 *   .validator(pattern(/^\d+(\.\d{1,2})?$/, 'Hours must be a valid decimal'))
 *   .build();
 * ```
 */
export function pattern(
  patternRegex: RegExp,
  message = "Invalid format",
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    const str = String(value);
    if (!patternRegex.test(str)) {
      return { valid: false, message };
    }

    return { valid: true };
  };
}

/**
 * Create a date validator
 *
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('date')
 *   .validator(isValidDate('Invalid date format'))
 *   .build();
 * ```
 */
export function isValidDate(
  message = "Invalid date",
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    const date = value instanceof Date ? value : new Date(value as string);

    if (Number.isNaN(date.getTime())) {
      return { valid: false, message };
    }

    return { valid: true };
  };
}

/**
 * Create a date range validator
 *
 * @param minDate - Minimum date (inclusive)
 * @param maxDate - Maximum date (inclusive)
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('date')
 *   .validator(dateRange(
 *     new Date('2024-01-01'),
 *     new Date('2024-12-31'),
 *     'Date must be in 2024'
 *   ))
 *   .build();
 * ```
 */
export function dateRange(
  minDate?: Date,
  maxDate?: Date,
  message?: string,
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    const date = value instanceof Date ? value : new Date(value as string);

    if (Number.isNaN(date.getTime())) {
      return { valid: false, message: "Invalid date" };
    }

    if (minDate && date < minDate) {
      return {
        valid: false,
        message:
          message ||
          `Date must be after ${minDate.toISOString().split("T")[0]}`,
      };
    }

    if (maxDate && date > maxDate) {
      return {
        valid: false,
        message:
          message ||
          `Date must be before ${maxDate.toISOString().split("T")[0]}`,
      };
    }

    return { valid: true };
  };
}

/**
 * Create a UUID validator
 *
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('projectId')
 *   .validator(isUUID('Invalid project ID'))
 *   .build();
 * ```
 */
export function isUUID(
  message = "Invalid UUID format",
): (value: unknown) => ValidationResult {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    const str = String(value);
    if (!uuidPattern.test(str)) {
      return { valid: false, message };
    }

    return { valid: true };
  };
}

/**
 * Combine multiple validators with AND logic
 *
 * @param validators - Array of validator functions
 * @returns Combined validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('hours')
 *   .validator(combine([
 *     required('Hours is required'),
 *     pattern(/^\d+(\.\d{1,2})?$/, 'Invalid format'),
 *     numberRange(0, 168, 'Hours must be 0-168')
 *   ]))
 *   .build();
 * ```
 */
export function combine(
  validators: Array<(value: unknown) => ValidationResult>,
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
}

/**
 * Create a custom validator function
 *
 * @param validatorFn - Custom validation function
 * @param message - Error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('hours')
 *   .validator(custom(
 *     (value) => value > 0 && value <= 24,
 *     'Hours must be between 1 and 24'
 *   ))
 *   .build();
 * ```
 */
export function custom(
  validatorFn: (value: unknown) => boolean,
  message: string,
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    const isValid = validatorFn(value);
    return isValid ? { valid: true } : { valid: false, message };
  };
}

/**
 * Create an email validator
 *
 * @param message - Custom error message
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const column = createColumnDef<User>()
 *   .field('email')
 *   .validator(isEmail('Invalid email address'))
 *   .build();
 * ```
 */
export function isEmail(
  message = "Invalid email address",
): (value: unknown) => ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (value: unknown): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { valid: true };
    }

    const str = String(value);
    if (!emailPattern.test(str)) {
      return { valid: false, message };
    }

    return { valid: true };
  };
}
