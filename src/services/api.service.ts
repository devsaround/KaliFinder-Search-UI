// API service for Kalifind Search

export interface ApiService {
  fetchPopularSearches: (storeUrl: string) => Promise<string[]>;
  fetchFacetConfiguration: (storeUrl: string) => Promise<any[]>;
  searchProducts: (params: URLSearchParams) => Promise<any>;
  fetchAutocomplete: (query: string, storeUrl: string) => Promise<any>;
}

// Simple in-memory cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class ApiServiceImpl implements ApiService {
  private baseUrl = import.meta.env.VITE_BACKEND_URL; // Replace with actual API URL
  private cache = new Map<string, CacheEntry>();

  // Cache TTL in milliseconds
  private readonly CACHE_TTL = {
    facetConfig: 30 * 60 * 1000, // 30 minutes
    recommendations: 5 * 60 * 1000, // 5 minutes
    popularSearches: 10 * 60 * 1000, // 10 minutes
  };

  private getCacheKey(method: string, ...params: string[]): string {
    return `${method}:${params.join(':')}`;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Clean up old entries if cache gets too large
    if (this.cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > v.ttl) {
          this.cache.delete(k);
        }
      }
    }
  }

  async fetchPopularSearches(storeUrl: string): Promise<string[]> {
    const cacheKey = this.getCacheKey('popularSearches', storeUrl);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v1/search/popular?storeUrl=${encodeURIComponent(storeUrl)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const result = data.searches || [];
      this.setCache(cacheKey, result, this.CACHE_TTL.popularSearches);
      return result;
    } catch (error) {
      console.error('Failed to fetch popular searches:', error);
      return [];
    }
  }

  async fetchFacetConfiguration(storeUrl: string): Promise<any[]> {
    const cacheKey = this.getCacheKey('facetConfig', storeUrl);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v1/facets?storeUrl=${encodeURIComponent(storeUrl)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const result = data || [];
      this.setCache(cacheKey, result, this.CACHE_TTL.facetConfig);
      return result;
    } catch (error) {
      console.error('Failed to fetch facet configuration:', error);
      return [];
    }
  }

  async searchProducts(params: URLSearchParams): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to search products:', error);
      return { products: [], total: 0 };
    }
  }

  async fetchAutocomplete(query: string, storeUrl: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/search/autocomplete?q=${encodeURIComponent(query)}&storeUrl=${encodeURIComponent(storeUrl)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch autocomplete:', error);
      return { suggestions: [] };
    }
  }
}

export const apiService = new ApiServiceImpl();
