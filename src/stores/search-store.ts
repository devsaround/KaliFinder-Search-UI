/**
 * Search Store (Zustand)
 * Manages search state, results, and pagination
 */

import type { SearchResponse } from '@/types/api.types';
import type { Product } from '@/types/index';
import { create } from 'zustand';

export interface SearchState {
  /** Current search query */
  query: string;
  setQuery: (query: string) => void;

  /** Current search results */
  products: Product[];
  setProducts: (products: Product[]) => void;

  /** Total product count */
  total: number;
  setTotal: (total: number) => void;

  /** Current page */
  page: number;
  setPage: (page: number) => void;

  /** Loading state */
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  /** Error state */
  error: string | null;
  setError: (error: string | null) => void;

  /** Full search response (for facets, etc.)  */
  lastResponse: SearchResponse | null;
  setLastResponse: (response: SearchResponse | null) => void;

  /** Reset search to initial state */
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),

  products: [],
  setProducts: (products) => set({ products }),

  total: 0,
  setTotal: (total) => set({ total }),

  page: 1,
  setPage: (page) => set({ page }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  error: null,
  setError: (error) => set({ error }),

  lastResponse: null,
  setLastResponse: (response) => set({ lastResponse: response }),

  reset: () =>
    set({
      query: '',
      products: [],
      total: 0,
      page: 1,
      isLoading: false,
      error: null,
      lastResponse: null,
    }),
}));
