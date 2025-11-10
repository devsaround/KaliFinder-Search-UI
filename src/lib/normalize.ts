/**
 * Normalize store URL to match backend format
 * Backend removes protocol and trailing slash for consistency
 *
 * Examples:
 * - "https://findifly-dev.myshopify.com" → "findifly-dev.myshopify.com"
 * - "findifly.kalifinder.com" → "findifly.kalifinder.com"
 * - "https://example.com/" → "example.com"
 */
export function normalizeStoreUrl(url?: string): string | undefined {
  if (!url) return url;

  // Remove protocol (http:// or https://) and trailing slash
  // This matches the backend normalization logic
  let normalized = url.trim();
  normalized = normalized.replace(/^https?:\/\//, ''); // Remove protocol
  normalized = normalized.replace(/\/$/, ''); // Remove trailing slash

  return normalized;
}
