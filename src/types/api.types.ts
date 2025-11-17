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

export interface PriceRangeBucket {
  from?: number;
  to?: number;
  doc_count: number;
  key?: string;
}

export interface SearchSuggestion {
  text: string;
  score?: number;
}

// Backend facet structure: Each facet is wrapped in a filter aggregation
// with nested terms/ranges aggregation for disjunctive faceting
export interface SearchFacets {
  category?: {
    buckets?: FacetBucket[];
  };
  brand?: {
    buckets?: FacetBucket[];
  };
  color?: {
    buckets?: FacetBucket[];
  };
  size?: {
    buckets?: FacetBucket[];
  };
  tag?: {
    buckets?: FacetBucket[];
  };
  instock?: {
    buckets?: FacetBucket[];
  };
  featured?: {
    buckets?: BooleanFacetBucket[];
  };
  insale?: {
    buckets?: BooleanFacetBucket[];
  };
  price?: {
    buckets?: PriceRangeBucket[];
  };
}

export interface SearchResponse {
  products: Product[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  facets?: SearchFacets;
  correctedQuery?: string;
  originalQuery?: string;
  wasCorrected?: boolean;
  suggestions?: SearchSuggestion[];
  queryId?: string;
  query_id?: string;
  // ✅ NEW: Zero-results handling fields
  message?: string; // User-friendly message (e.g., "No results found for 'pants'")
  showingRecommended?: boolean; // Flag indicating recommended products are shown instead of search results
  // ✅ NEW: Store currency from backend (e.g., "USD", "EUR")
  currency?: string | null; // Store currency for price display
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
    Array.isArray((response as { products: unknown }).products) &&
    'total' in response &&
    typeof (response as { total: unknown }).total === 'number'
  );
}

export function isAutocompleteResponse(response: unknown): response is AutocompleteResponse {
  return Array.isArray(response);
}
