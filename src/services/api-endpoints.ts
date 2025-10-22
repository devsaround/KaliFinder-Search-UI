/**
 * API Endpoints Configuration
 * Centralized endpoint definitions with type safety
 */

import type { WidgetConfig } from '@/config/widget-config';

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  SEARCH: '/search',
  AUTOCOMPLETE: '/autocomplete',
  RECOMMENDATIONS: '/recommendations',
  FACETS: '/facets',
  POPULAR_SEARCHES: '/popular-searches',
  PRODUCT_DETAILS: '/products/:id',
} as const;

/**
 * Build search endpoint URL with parameters
 */
export function buildSearchUrl(baseUrl: string, params: Record<string, unknown>): string {
  const url = new URL(API_ENDPOINTS.SEARCH, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });

  return url.toString();
}

/**
 * Build autocomplete endpoint URL
 */
export function buildAutocompleteUrl(baseUrl: string, query: string): string {
  const url = new URL(API_ENDPOINTS.AUTOCOMPLETE, baseUrl);
  url.searchParams.append('q', query);
  return url.toString();
}

/**
 * Build recommendations endpoint URL
 */
export function buildRecommendationsUrl(baseUrl: string, productId?: string): string {
  const url = new URL(API_ENDPOINTS.RECOMMENDATIONS, baseUrl);

  if (productId) {
    url.searchParams.append('productId', productId);
  }

  return url.toString();
}

/**
 * Build facets endpoint URL
 */
export function buildFacetsUrl(baseUrl: string, query?: string): string {
  const url = new URL(API_ENDPOINTS.FACETS, baseUrl);

  if (query) {
    url.searchParams.append('q', query);
  }

  return url.toString();
}

/**
 * Build popular searches endpoint URL
 */
export function buildPopularSearchesUrl(baseUrl: string): string {
  return new URL(API_ENDPOINTS.POPULAR_SEARCHES, baseUrl).toString();
}

/**
 * Get timeout value from config
 */
export function getRequestTimeout(config: WidgetConfig): number {
  return config.api.timeout;
}

/**
 * Get retry configuration from config
 */
export function getRetryConfig(config: WidgetConfig): { attempts: number; delayMs: number } {
  return {
    attempts: config.api.retryAttempts,
    delayMs: config.api.retryDelay,
  };
}

/**
 * Build common request headers
 */
export function buildRequestHeaders(config: WidgetConfig): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Widget-Version': '1.0.0',
    'X-Widget-Instance': config.instanceId,
  };
}
