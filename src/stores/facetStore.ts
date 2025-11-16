/**
 * Facet Store - Industry Standard (Algolia/Doofinder Pattern)
 *
 * Simple, clean facet management:
 * - Backend sends reactive facets in bucket format
 * - Frontend stores and displays them as-is
 * - No redundant state, no global vs filtered logic
 * - Facet counts update automatically based on active filters (backend handles this)
 */

import { create } from 'zustand';
import type { FacetBucket } from '../types/api.types';

export interface FacetBuckets {
  category?: FacetBucket[];
  brand?: FacetBucket[];
  color?: FacetBucket[];
  size?: FacetBucket[];
  tag?: FacetBucket[];
  instock?: FacetBucket[];
  featured?: FacetBucket[];
  insale?: FacetBucket[];
  price?: FacetBucket[];
}

interface FacetState {
  // Current facet buckets from API (reactive, updates with filters)
  facets: FacetBuckets;

  // Update facets from API response
  setFacets: (facets: FacetBuckets) => void;

  // Clear all facets
  clearFacets: () => void;
}

export const useFacetStore = create<FacetState>((set) => ({
  facets: {},

  setFacets: (facets) => set({ facets }),

  clearFacets: () => set({ facets: {} }),
}));
