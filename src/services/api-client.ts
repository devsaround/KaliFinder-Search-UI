/**
 * Refactored API Client
 * Single source of truth for all API interactions with proper error handling and caching
 */

import type { WidgetConfig } from '@/config/widget-config';
import type { AutocompleteResponse, SearchResponse } from '@/types/api.types';
import {
  buildAutocompleteUrl,
  buildFacetsUrl,
  buildPopularSearchesUrl,
  buildRequestHeaders,
  buildSearchUrl,
  getRetryConfig,
} from './api-endpoints';
import { HttpClient } from './http-client';
import { ResponseCache, buildCacheKey } from './response-cache';

/**
 * Search parameters interface
 */
export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  filters?: Record<string, unknown>;
  sort?: string;
  storeUrl?: string; // align with backend requirement
}

/**
 * API Client with caching and error handling
 */
export class ApiClient {
  private httpClient: HttpClient;
  private cache: ResponseCache;

  constructor(private config: WidgetConfig) {
    this.httpClient = new HttpClient(config);
    this.cache = new ResponseCache(config.cache.maxSize);
  }

  /**
   * Search products
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    if (!params.q || params.q.trim().length < this.config.behavior.minCharsForSearch) {
      throw new Error(
        `Query must be at least ${this.config.behavior.minCharsForSearch} characters`
      );
    }

    const cacheKey = buildCacheKey('/search', params as unknown as Record<string, unknown>);

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get<SearchResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = buildSearchUrl(this.config.api.baseUrl, {
      q: params.q,
      page: params.page || 1,
      limit: params.limit || this.config.behavior.maxResults,
      ...(params.filters && { filters: params.filters }),
      ...(params.sort && { sort: params.sort }),
      ...(params.storeUrl && { storeUrl: params.storeUrl }),
    });

    const response = await this.httpClient.get<SearchResponse>(url, {
      headers: buildRequestHeaders(this.config),
      retryConfig: getRetryConfig(this.config),
    });

    // Cache the response
    if (this.config.cache.enabled) {
      this.cache.set(cacheKey, response, this.config.cache.ttl.search);
    }

    return response;
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete(query: string, storeUrl?: string): Promise<AutocompleteResponse> {
    if (!query || query.trim().length < this.config.behavior.minCharsForSearch) {
      return { suggestions: [] };
    }

    const cacheKey = buildCacheKey('/autocomplete', { q: query });

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get<AutocompleteResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url =
      buildAutocompleteUrl(this.config.api.baseUrl, query) +
      (storeUrl ? `&storeUrl=${encodeURIComponent(storeUrl)}` : '');

    const response = await this.httpClient.get<AutocompleteResponse>(url, {
      headers: buildRequestHeaders(this.config),
      retryConfig: getRetryConfig(this.config),
    });

    // Cache the response
    if (this.config.cache.enabled) {
      this.cache.set(cacheKey, response, this.config.cache.ttl.autocomplete);
    }

    return response;
  }

  /**
   * Get search facets/filters
   */
  async getFacets(query?: string, storeUrl?: string): Promise<Record<string, unknown>> {
    const cacheKey = buildCacheKey('/facets', { q: query });

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get<Record<string, unknown>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url =
      buildFacetsUrl(this.config.api.baseUrl, query) +
      (storeUrl ? `&storeUrl=${encodeURIComponent(storeUrl)}` : '');

    const response = await this.httpClient.get<Record<string, unknown>>(url, {
      headers: buildRequestHeaders(this.config),
      retryConfig: getRetryConfig(this.config),
    });

    // Cache the response
    if (this.config.cache.enabled) {
      this.cache.set(cacheKey, response, this.config.cache.ttl.facets);
    }

    return response;
  }

  /**
   * Get popular/trending searches
   */
  async getPopularSearches(storeUrl?: string): Promise<string[]> {
    const cacheKey =
      '/popular-searches' + (storeUrl ? `?storeUrl=${encodeURIComponent(storeUrl)}` : '');

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.cache.get<string[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    let url = buildPopularSearchesUrl(this.config.api.baseUrl);
    if (storeUrl) {
      url += (url.includes('?') ? '&' : '?') + `storeUrl=${encodeURIComponent(storeUrl)}`;
    }

    const response = await this.httpClient.get<{ searches: string[] }>(url, {
      headers: buildRequestHeaders(this.config),
      retryConfig: getRetryConfig(this.config),
    });

    const searches = response.searches || [];

    // Cache the response
    if (this.config.cache.enabled) {
      this.cache.set(cacheKey, searches, this.config.cache.ttl.autocomplete);
    }

    return searches;
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
