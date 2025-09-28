// API Response type guards and utilities

export interface SearchResponse {
  products: any[];
  total: number;
  facets?: {
    categories: { [key: string]: number };
    brands: { [key: string]: number };
    colors: { [key: string]: number };
    sizes: { [key: string]: number };
    tags: { [key: string]: number };
    stockStatus?: { [key: string]: number };
    featured?: { [key: string]: number };
    insale?: { [key: string]: number };
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
