/**
 * Filter Store (Zustand)
 * Manages search filters and facet state
 */

import { create } from 'zustand';

export interface FilterOptions {
  category?: string[];
  brand?: string[];
  color?: string[];
  size?: string[];
  tag?: string[];
  price?: { min?: number; max?: number };
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  [key: string]: unknown;
}

export interface Facet {
  key: string;
  count: number;
  label?: string;
}

export interface FacetGroup {
  name: string;
  facets: Facet[];
  type?: 'checkbox' | 'slider' | 'toggle';
}

export interface FilterState {
  /** Active filters */
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  updateFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;

  /** Available facets */
  facets: Map<string, FacetGroup>;
  setFacets: (facets: Map<string, FacetGroup>) => void;
  addFacet: (name: string, facetGroup: FacetGroup) => void;

  /** Loading state */
  isLoadingFacets: boolean;
  setIsLoadingFacets: (loading: boolean) => void;

  /** Reset to default state */
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: () => set({ filters: {} }),

  facets: new Map(),
  setFacets: (facets) => set({ facets }),
  addFacet: (name, facetGroup) =>
    set((state) => {
      const newFacets = new Map(state.facets);
      newFacets.set(name, facetGroup);
      return { facets: newFacets };
    }),

  isLoadingFacets: false,
  setIsLoadingFacets: (loading) => set({ isLoadingFacets: loading }),

  reset: () =>
    set({
      filters: {},
      facets: new Map(),
      isLoadingFacets: false,
    }),
}));
