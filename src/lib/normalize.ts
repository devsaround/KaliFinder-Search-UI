/**
 * Normalize store URL to match backend format
 * CRITICAL: Must match backend's normalizeStoreUrl() logic exactly
 *
 * Shopify stores:
 * - "https://findifly-dev.myshopify.com" → "findifly-dev.myshopify.com"
 * - "findifly-dev.myshopify.com" → "findifly-dev.myshopify.com"
 * - "findifly-dev" → "findifly-dev.myshopify.com" (adds .myshopify.com)
 *
 * WooCommerce stores:
 * - "https://example.com/" → "example.com"
 * - "findifly.kalifinder.com" → "findifly.kalifinder.com"
 */
export function normalizeStoreUrl(url?: string): string | undefined {
  if (!url) return url;

  // Remove protocol (http:// or https://) and trailing slash
  let normalized = url.trim();
  normalized = normalized.replace(/^https?:\/\//, ''); // Remove protocol
  normalized = normalized.replace(/\/$/, ''); // Remove trailing slash

  // Auto-detect store type and apply specific normalization
  // Shopify stores: Ensure .myshopify.com suffix
  if (normalized.includes('myshopify.com')) {
    // Already has .myshopify.com, return as-is
    return normalized;
  } else if (!normalized.includes('.')) {
    // Just shop name (e.g., "findifly-dev") - add .myshopify.com suffix
    return `${normalized}.myshopify.com`;
  }

  // WooCommerce stores: Just return normalized URL
  return normalized;
}
