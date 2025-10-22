/**
 * useFiltersManager Hook
 * Encapsulates filter logic with debounced re-search
 */

import type { ApiClient } from '@/services/api-client';
import { useFilterStore } from '@/stores/filter-store';
import { useSearchStore } from '@/stores/search-store';
import { useCallback, useEffect } from 'react';
import { useDebounce } from './use-debounce';

export interface UseFiltersManagerOptions {
  apiClient: ApiClient;
  onFiltersChange?: (filters: Record<string, unknown>) => void;
}

export function useFiltersManager(options: UseFiltersManagerOptions) {
  const { apiClient, onFiltersChange } = options;

  const { filters, updateFilter, clearFilters } = useFilterStore();
  const { query } = useSearchStore();

  // Debounce filter changes to avoid excessive searches
  const debouncedFilters = useDebounce(filters, 300);

  /**
   * Load available facets for current search
   */
  const loadFacets = useCallback(async () => {
    try {
      // Implementation would load facets from API
      if (query) {
        await apiClient.getFacets(query);
      }
    } catch (error) {
      console.error('Failed to load facets:', error);
    }
  }, [apiClient, query]);

  /**
   * Update single filter and trigger re-search
   */
  const handleFilterChange = useCallback(
    (key: string, value: unknown) => {
      updateFilter(key, value);
      onFiltersChange?.(filters);
    },
    [updateFilter, filters, onFiltersChange]
  );

  /**
   * Re-search when filters change
   */
  useEffect(() => {
    if (query) {
      // Trigger search with new filters
      // This would be implemented in the parent component
    }
  }, [debouncedFilters, query]);

  return {
    filters,
    updateFilter: handleFilterChange,
    clearFilters,
    loadFacets,
  };
}
