// API service for Kalifind Search
import type { AutocompleteResponse, SearchResponse } from '@/types/api.types';

export interface FacetConfig {
  field: string;
  label: string;
  type: string;
  enabled: boolean;
  visible: boolean;
}

export interface ApiService {
  fetchPopularSearches: (storeUrl: string) => Promise<string[]>;
  fetchFacetConfiguration: (storeUrl: string) => Promise<FacetConfig[]>;
  searchProducts: (params: URLSearchParams) => Promise<SearchResponse>;
  fetchAutocomplete: (query: string, storeUrl: string) => Promise<AutocompleteResponse>;
}

// Rate limit state (shared across all API calls)
export interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number; // seconds
  tier: string;
  upgradeUrl: string;
  message: string;
}

// Simple in-memory cache for API responses
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiServiceImpl implements ApiService {
  private baseUrl = import.meta.env.VITE_BACKEND_URL; // Replace with actual API URL
  private cache = new Map<string, CacheEntry>();
  private rateLimitState: RateLimitState | null = null;

  // Cache TTL in milliseconds
  private readonly CACHE_TTL = {
    facetConfig: 30 * 60 * 1000, // 30 minutes
    recommendations: 5 * 60 * 1000, // 5 minutes
    popularSearches: 10 * 60 * 1000, // 10 minutes
  };

  private getCacheKey(method: string, ...params: string[]): string {
    return `${method}:${params.join(':')}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
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

  private async fetchWithRateLimitHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<T | null> {
    // Check if currently rate limited
    if (this.rateLimitState && this.rateLimitState.isRateLimited) {
      const now = Date.now();
      const resetTime = now + this.rateLimitState.retryAfter * 1000;

      if (Date.now() < resetTime) {
        console.warn('⚠️ Rate limited, skipping request');
        return null;
      } else {
        // Rate limit expired, clear state
        this.rateLimitState = null;
      }
    }

    try {
      const response = await fetch(url, options);

      // Log rate limit headers
      const remaining = response.headers.get('ratelimit-remaining');
      const limit = response.headers.get('ratelimit-limit');

      if (remaining && parseInt(remaining) < 10) {
        console.warn(`⚠️ Rate limit warning: ${remaining}/${limit} requests remaining`);
      }

      // Handle 429 Rate Limit
      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = parseInt(response.headers.get('retry-after') || '60');

        this.rateLimitState = {
          isRateLimited: true,
          retryAfter,
          tier: data.tier || 'free',
          upgradeUrl: data.upgradeUrl || 'https://kalifinder.com/pricing',
          message: data.message || 'Rate limit exceeded',
        };

        console.error(`🚫 Rate limit exceeded:`, this.rateLimitState);

        // Dispatch custom event for UI to handle
        window.dispatchEvent(
          new CustomEvent('kalifind:ratelimit', {
            detail: this.rateLimitState,
          })
        );

        return null;
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return null;
    }
  }

  async searchProducts(params: URLSearchParams): Promise<SearchResponse> {
    const url = `${this.baseUrl}/api/v1/search/search?${params.toString()}`;
    const json = await this.fetchWithRateLimitHandling<any>(url);

    if (!json || json.success !== true || !json.data) {
      // Return empty results when rate limited
      return {
        products: [],
        total: 0,
      };
    }

    return json.data as SearchResponse;
  }

  async fetchAutocomplete(query: string, storeUrl: string): Promise<AutocompleteResponse> {
    const url = `${this.baseUrl}/api/v1/search/autocomplete?q=${encodeURIComponent(query)}&storeUrl=${encodeURIComponent(storeUrl)}`;
    const json = await this.fetchWithRateLimitHandling<any>(url);

    if (!json || json.success !== true || !json.data) {
      return [];
    }

    return json.data as AutocompleteResponse;
  }

  async fetchPopularSearches(storeUrl: string): Promise<string[]> {
    const cacheKey = this.getCacheKey('popularSearches', storeUrl);
    const cached = this.getFromCache<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/search/popular?storeUrl=${encodeURIComponent(storeUrl)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      const result =
        json && json.success && Array.isArray(json.data?.searches) ? json.data.searches : [];
      this.setCache(cacheKey, result, this.CACHE_TTL.popularSearches);
      return result;
    } catch (error) {
      console.error('Failed to fetch popular searches:', error);
      return [];
    }
  }

  async fetchFacetConfiguration(storeUrl: string): Promise<FacetConfig[]> {
    const cacheKey = this.getCacheKey('facetConfig', storeUrl);
    const cached = this.getFromCache<FacetConfig[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/facets/configured?storeUrl=${encodeURIComponent(storeUrl)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      const result =
        json && json.success && json.data?.facets ? (json.data.facets as FacetConfig[]) : [];
      this.setCache(cacheKey, result, this.CACHE_TTL.facetConfig);
      return result;
    } catch (error) {
      console.error('Failed to fetch facet configuration:', error);
      return [];
    }
  }
}

export const apiService = new ApiServiceImpl();
