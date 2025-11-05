export function normalizeStoreUrl(url?: string): string | undefined {
  if (!url) return url;

  // ✅ KEEP the full URL with https:// - backend database stores full URLs
  // Only trim trailing slash for consistency
  let normalized = url.trim().replace(/\/$/, '');

  // If URL doesn't start with https://, add it
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}
