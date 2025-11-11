// API Response type guards and utilities
import type { Product } from './index';

// Facet bucket types
export interface FacetBucket {
  key: string | number | boolean;
  key_as_string?: string;
  doc_count: number;
  from?: number;
  to?: number;
}

export interface StringFacetBucket {
  key: string;
  doc_count: number;
}

export interface BooleanFacetBucket {
  key: number | boolean;
  key_as_string?: string;
  doc_count: number;
}

export interface SearchResponse {
  products: Product[];
  total: number;
  facets?: {
    category?: {
      buckets: StringFacetBucket[];
    };
    brands?: {
      buckets: StringFacetBucket[];
    };
    colors?: {
      buckets: StringFacetBucket[];
    };
    sizes?: {
      buckets: StringFacetBucket[];
    };
    tags?: {
      buckets: StringFacetBucket[];
    };
    price?: {
      buckets: Array<{ key: string; from?: number; to?: number; doc_count: number }>;
    };
    instock?: {
      buckets: StringFacetBucket[];
    };
    featured?: {
      buckets: BooleanFacetBucket[];
    };
    insale?: {
      buckets: BooleanFacetBucket[];
    };
  };
  hasMore?: boolean;
}

export interface AutocompleteSuggestion {
  title: string;
  id: string;
}

// Backend returns {success: true, data: AutocompleteSuggestion[]}
// HttpClient unwraps to just AutocompleteSuggestion[]
export type AutocompleteResponse = AutocompleteSuggestion[];

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
  return Array.isArray(response);
}
