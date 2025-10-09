// API Response type guards and utilities

export interface SearchResponse {
  products: any[];
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
export function isSearchResponse(response: any): response is SearchResponse {
  return (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.products) &&
    typeof response.total === 'number'
  );
}

export function isAutocompleteResponse(response: any): response is AutocompleteResponse {
  return (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.suggestions)
  );
}
