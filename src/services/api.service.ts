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

// Simple in-memory cache for API responses
interface CacheEntry<T = unknown> {
  data: T;
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

  async fetchPopularSearches(storeUrl: string): Promise<string[]> {
    const cacheKey = this.getCacheKey('popularSearches', storeUrl);
    const cached = this.getFromCache<string[]>(cacheKey);
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

  async fetchFacetConfiguration(storeUrl: string): Promise<FacetConfig[]> {
    const cacheKey = this.getCacheKey('facetConfig', storeUrl);
    const cached = this.getFromCache<FacetConfig[]>(cacheKey);
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

  async searchProducts(params: URLSearchParams): Promise<SearchResponse> {
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

  async fetchAutocomplete(query: string, storeUrl: string): Promise<AutocompleteResponse> {
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
