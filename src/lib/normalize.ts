export function normalizeStoreUrl(url?: string): string | undefined {
  if (!url) return url;
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
