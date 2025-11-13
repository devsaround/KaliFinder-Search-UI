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

export interface SearchSuggestion {
  text: string;
  score?: number;
}

export interface SearchFacets {
  [key: string]: {
    buckets?: FacetBucket[] | StringFacetBucket[] | BooleanFacetBucket[];
    doc_count?: number;
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
