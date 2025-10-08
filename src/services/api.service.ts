// API service for Kalifind Search

export interface ApiService {
  fetchPopularSearches: (storeUrl: string) => Promise<string[]>;
  fetchFacetConfiguration: (storeUrl: string) => Promise<any[]>;
  searchProducts: (params: URLSearchParams) => Promise<any>;
  fetchAutocomplete: (query: string, storeUrl: string) => Promise<any>;
}

class ApiServiceImpl implements ApiService {
  private baseUrl = import.meta.env.VITE_BACKEND_URL ; // Replace with actual API URL

  async fetchPopularSearches(storeUrl: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/search/popular?storeUrl=${encodeURIComponent(storeUrl)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.searches || [];
    } catch (error) {
      console.error('Failed to fetch popular searches:', error);
      return [];
    }
  }

  async fetchFacetConfiguration(storeUrl: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/facets?storeUrl=${encodeURIComponent(storeUrl)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch facet configuration:', error);
      return [];
    }
  }

  async searchProducts(params: URLSearchParams): Promise<any> {
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

  async fetchAutocomplete(query: string, storeUrl: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/search/autocomplete?q=${encodeURIComponent(query)}&storeUrl=${encodeURIComponent(storeUrl)}`);
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
