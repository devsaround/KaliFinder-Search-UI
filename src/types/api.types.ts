// API Response type guards and utilities
import type { Product } from './index';

export interface SearchResponse {
  products: Product[];
  total: number;
  facets?: {
    category?: {
      buckets: Array<{ key: string; doc_count: number }>;
    };
    brands?: {
      buckets: Array<{ key: string; doc_count: number }>;
    };
    colors?: {
      buckets: Array<{ key: string; doc_count: number }>;
    };
    sizes?: {
      buckets: Array<{ key: string; doc_count: number }>;
    };
    tags?: {
      buckets: Array<{ key: string; doc_count: number }>;
    };
    price?: {
      buckets: Array<{ key: string; from?: number; to?: number; doc_count: number }>;
    };
    instock?: {
      buckets: Array<{ key: string; key_as_string?: string; doc_count: number }>;
    };
    featured?: {
      buckets: Array<{ key: number; key_as_string: string; doc_count: number }>;
    };
    insale?: {
      buckets: Array<{ key: number; key_as_string: string; doc_count: number }>;
    };
  };
  hasMore?: boolean;
}

export interface AutocompleteResponse {
  suggestions: string[];
}

// Type guards
export function isSearchResponse(response: unknown): response is SearchResponse {
  return (
    response !== null &&
    response !== undefined &&
    typeof response === 'object' &&
    'products' in response &&
    Array.isArray(response.products) &&
    'total' in response &&
    typeof response.total === 'number'
  );
}

export function isAutocompleteResponse(response: unknown): response is AutocompleteResponse {
  return (
    response !== null &&
    response !== undefined &&
    typeof response === 'object' &&
    'suggestions' in response &&
    Array.isArray(response.suggestions)
  );
}
