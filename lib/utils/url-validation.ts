/**
 * URL Validation Utilities
 *
 * Common validation functions for URL parameters used across server and client components.
 * Ensures consistent validation logic for dates, UUIDs, and other URL-based data.
 */

/**
 * UUID v4 validation pattern
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ISO 8601 date format pattern (YYYY-MM-DD)
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates if a string is a valid UUID v4
 * @param id - String to validate as UUID
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUUID(id: string): boolean {
  return UUID_V4_PATTERN.test(id);
}

/**
 * Parses a URL parameter as a single UUID
 *
 * @param param - URL parameter value (e.g., "123e4567-e89b-12d3-a456-426614174000")
 * @returns Valid UUID string, or undefined if invalid
 *
 * @example
 * ```typescript
 * parseUrlUUID("123e4567-e89b-12d3-a456-426614174000")
 * // Returns: "123e4567-e89b-12d3-a456-426614174000"
 *
 * parseUrlUUID("invalid-uuid") // Returns: undefined
 * parseUrlUUID("") // Returns: undefined
 * ```
 */
export function parseUrlUUID(
  param: string | null | undefined,
): string | undefined {
  if (!param || param.trim() === "") return undefined;
  const trimmed = param.trim();
  return isValidUUID(trimmed) ? trimmed : undefined;
}

/**
 * Parses a URL parameter containing comma-separated UUIDs
 *
 * @param param - URL parameter value (e.g., "uuid1,uuid2,uuid3")
 * @returns Array of valid UUIDs, or undefined if no valid UUIDs found
 *
 * @example
 * ```typescript
 * parseUrlUUIDs("123e4567-e89b-12d3-a456-426614174000,invalid-uuid")
 * // Returns: ["123e4567-e89b-12d3-a456-426614174000"]
 *
 * parseUrlUUIDs("") // Returns: undefined
 * parseUrlUUIDs(",,,") // Returns: undefined
 * ```
 */
export function parseUrlUUIDs(
  param: string | null | undefined,
): string[] | undefined {
  if (!param || param.trim() === "") return undefined;

  const ids = param
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "" && isValidUUID(id));

  return ids.length > 0 ? ids : undefined;
}

/**
 * Parses a URL parameter as a date string in ISO 8601 format (YYYY-MM-DD)
 *
 * @param dateStr - URL parameter value (e.g., "2024-01-15")
 * @returns Date object if valid, undefined otherwise
 *
 * @example
 * ```typescript
 * parseUrlDate("2024-01-15") // Returns: Date object
 * parseUrlDate("01/15/2024") // Returns: undefined (invalid format)
 * parseUrlDate("invalid") // Returns: undefined
 * ```
 */
export function parseUrlDate(
  dateStr: string | null | undefined,
): Date | undefined {
  if (!dateStr || dateStr.trim() === "") return undefined;

  // Validate format first (YYYY-MM-DD)
  if (!ISO_DATE_PATTERN.test(dateStr)) return undefined;

  const date = new Date(dateStr);
  // Check if date is valid (not NaN)
  if (Number.isNaN(date.getTime())) return undefined;

  // Check if the date was auto-corrected by JavaScript (e.g., Feb 30 -> Mar 1)
  // This ensures dates like "2024-02-30" or "2023-02-29" are rejected
  const [year, month, day] = dateStr.split("-").map(Number);
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

/**
 * Validates if a string is in ISO 8601 date format (YYYY-MM-DD) and represents a valid date
 *
 * @param dateStr - String to validate
 * @returns true if valid date string, false otherwise
 *
 * @example
 * ```typescript
 * isValidDateString("2024-01-15") // Returns: true
 * isValidDateString("2024-13-01") // Returns: false (invalid month)
 * isValidDateString("01/15/2024") // Returns: false (wrong format)
 * ```
 */
export function isValidDateString(dateStr: string): boolean {
  if (!ISO_DATE_PATTERN.test(dateStr)) return false;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  // Check if the date was auto-corrected (e.g., Feb 30 -> Mar 1)
  const [year, month, day] = dateStr.split("-").map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}
