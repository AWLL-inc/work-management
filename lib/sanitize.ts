/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * This is a basic implementation. For production use, consider using
 * a library like DOMPurify for more comprehensive sanitization.
 */

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
];

const ALLOWED_ATTRIBUTES = ["href", "class"];

/**
 * Basic HTML sanitization
 * Removes script tags, event handlers, and dangerous attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, "");

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, "");

  return sanitized;
}

/**
 * Validate HTML content length
 */
export function validateHtmlLength(html: string, maxLength = 10000): boolean {
  if (!html) return true;

  // Strip HTML tags for length calculation
  const textContent = html.replace(/<[^>]*>/g, "");
  return textContent.length <= maxLength;
}

/**
 * Extract plain text from HTML
 */
export function extractPlainText(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}
