/**
 * Response Caching Layer
 * Provides in-memory caching with TTL support and LRU eviction
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

/**
 * In-memory cache with TTL and LRU eviction
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private accessOrder: string[] = [];
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };

  constructor(private maxSize: number = 100) {}

  /**
   * Get value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.updateAccessOrder(key, true);
      this.stats.misses++;
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.updateAccessOrder(key, true);
    }

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    this.updateAccessOrder(key);
    this.stats.size = this.cache.size;
  }

  /**
   * Check if key exists in cache and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.updateAccessOrder(key, true);
      return false;
    }

    return true;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = { hits: 0, misses: 0, size: 0 };
  }

  /**
   * Remove specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.updateAccessOrder(key, true);
    this.stats.size = this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get hit rate percentage
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : (this.stats.hits / total) * 100;
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string, remove = false): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    if (!remove) {
      this.accessOrder.push(key);
    }
  }
}

/**
 * Build cache key from endpoint and parameters
 */
export function buildCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${endpoint}:${sortedParams}`;
}
