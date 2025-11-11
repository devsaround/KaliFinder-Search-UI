/**
 * Search Service
 * Centralized service for all search-related API calls with improved error handling and caching
 */

import { normalizeStoreUrl } from '@/lib/normalize';
import type { AutocompleteResponse, SearchResponse } from '@/types/api.types';
import { HttpClient } from './http-client';
import { ResponseCache, buildCacheKey } from './response-cache';

// Default configuration - compatible with WidgetConfig
const DEFAULT_CONFIG = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'https://api.kalifinder.com',
  cache: {
    enabled: false, // Temporarily disabled for debugging
    ttl: {
      search: 300000, // 5 minutes
      autocomplete: 180000, // 3 minutes
      popularSearches: 600000, // 10 minutes
      facets: 1800000, // 30 minutes
    },
    maxSize: 100,
  },
  behavior: {
    minCharsForSearch: 1, // Allow single character searches
    maxResults: 50,
    debounceDelay: 300,
  },
  api: {
    timeout: 5000,
    retryAttempts: 2,
    retryDelay: 300,
  },
};

// Search parameters interface
export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  storeUrl?: string;
  categories?: string[];
  colors?: string[];
  sizes?: string[];
  brands?: string[];
  tags?: string[];
  stockStatus?: string[];
  priceRange?: [number, number];
  sort?: string;
  insale?: string; // 'true' | 'false' for on sale filter
  featured?: string; // 'true' | 'false' for featured filter
}

class SearchService {
  private httpClient: HttpClient;
  private cache: ResponseCache;
  private config: typeof DEFAULT_CONFIG;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    // @ts-expect-error - HttpClient expects WidgetConfig but we use compatible subset
    this.httpClient = new HttpClient(this.config);
    this.cache = new ResponseCache(this.config.cache.maxSize);
  }

  /**
   * Search products with improved caching and error handling
   */
  async searchProducts(params: SearchParams): Promise<SearchResponse> {
    // Validate minimum query length
    if (params.q && params.q.trim().length < this.config.behavior.minCharsForSearch) {
      return { products: [], total: 0 };
    }

    // Build URL with search parameters
    const urlParams = new URLSearchParams();

    if (params.q) {
      urlParams.append('q', params.q);
    }

    if (params.storeUrl) {
      urlParams.append('storeUrl', normalizeStoreUrl(params.storeUrl)!);
    }

    if (params.page) {
      urlParams.append('page', params.page.toString());
    }

    if (params.limit) {
      urlParams.append('limit', params.limit.toString());
    }

    if (params.sort) {
      urlParams.append('sort', params.sort);
    }

    // Add filter parameters
    if (params.categories?.length) {
      urlParams.append('categories', params.categories.join(','));
    }

    if (params.colors?.length) {
      urlParams.append('colors', params.colors.join(','));
    }

    if (params.sizes?.length) {
      urlParams.append('sizes', params.sizes.join(','));
    }

    if (params.brands?.length) {
      urlParams.append('brands', params.brands.join(','));
    }

    if (params.tags?.length) {
      urlParams.append('tags', params.tags.join(','));
    }

    if (params.stockStatus?.length) {
      urlParams.append('stockStatus', params.stockStatus.join(','));
    }

    if (params.priceRange) {
      urlParams.append('minPrice', params.priceRange[0].toString());
      urlParams.append('maxPrice', params.priceRange[1].toString());
    }

    // Add sale and featured filters
    if (params.insale !== undefined) {
      urlParams.append('insale', params.insale);
    }

    if (params.featured !== undefined) {
      urlParams.append('featured', params.featured);
    }

    const url = `${this.config.baseUrl}/api/v1/search/search?${urlParams.toString()}`;

    // Generate cache key based on all search parameters
    const cacheKey = buildCacheKey('/search', params as unknown as Record<string, unknown>);

    // Check cache first if enabled
    if (this.config.cache.enabled) {
      const cached = this.cache.get<SearchResponse>(cacheKey);
      if (cached) {
        console.log('KaliFinder Search Service: Returning cached result, total =', cached.total);
        return cached;
      }
    }

    try {
      // Determine dynamic TTL based on result size
      const response = await this.httpClient.get<SearchResponse>(url);

      console.log(
        'KaliFinder Search Service: Fresh API call, total =',
        response.total,
        'products =',
        response.products?.length
      );

      // Calculate dynamic TTL based on result size
      // Larger result sets get shorter TTL to manage memory better
      const resultSize = response.products?.length || 0;
      const dynamicTtl =
        resultSize > 50
          ? 180000 // 3 minutes for large result sets
          : 600000; // 10 minutes for smaller result sets

      // Cache the response with dynamic TTL
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, response, dynamicTtl);
      }

      return response;
    } catch (error) {
      console.error('Search failed:', error);
      // Return empty results on error
      return { products: [], total: 0 };
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete(query: string, storeUrl?: string): Promise<AutocompleteResponse> {
    if (!query || query.trim().length < this.config.behavior.minCharsForSearch) {
      return [];
    }

    const cacheKey = buildCacheKey('/autocomplete', { q: query, storeUrl });

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get<AutocompleteResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = `${this.config.baseUrl}/api/v1/search/autocomplete?q=${encodeURIComponent(query)}${
      storeUrl ? `&storeUrl=${encodeURIComponent(normalizeStoreUrl(storeUrl)!)}` : ''
    }`;

    try {
      const response = await this.httpClient.get<AutocompleteResponse>(url);

      // Cache the response
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, response, this.config.cache.ttl.autocomplete);
      }

      return response;
    } catch (error) {
      console.error('Autocomplete failed:', error);
      return [];
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(storeUrl?: string): Promise<string[]> {
    const normalizedStoreUrl = storeUrl ? normalizeStoreUrl(storeUrl) : undefined;
    const cacheKey = buildCacheKey('/popular-searches', { storeUrl: normalizedStoreUrl });

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get<string[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = `${this.config.baseUrl}/api/v1/search/popular${
      normalizedStoreUrl ? `?storeUrl=${encodeURIComponent(normalizedStoreUrl)}` : ''
    }`;

    try {
      const response = await this.httpClient.get<{ searches: string[] }>(url);
      const searches = response.searches || [];

      // Cache the response
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, searches, this.config.cache.ttl.popularSearches);
      }

      return searches;
    } catch (error) {
      console.error('Failed to fetch popular searches:', error);
      return [];
    }
  }

  /**
   * Get facet configuration
   */
  async getFacetConfiguration(storeUrl: string): Promise<any[]> {
    const cacheKey = buildCacheKey('/facet-config', { storeUrl });

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = `${this.config.baseUrl}/api/v1/facets/configured?storeUrl=${encodeURIComponent(
      normalizeStoreUrl(storeUrl)!
    )}`;

    try {
      const response = await this.httpClient.get<any[]>(url);

      // Cache the response with longer TTL since facet config rarely changes
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, response, this.config.cache.ttl.facets);
      }

      return response;
    } catch (error) {
      console.error('Failed to fetch facet configuration:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

// Export singleton instance
export const searchService = new SearchService();
