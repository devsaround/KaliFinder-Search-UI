/**
 * useSearch Hook
 * Encapsulates all search logic and API calls
 */

import type { WidgetConfig } from '@/config/widget-config';
import type { ApiClient } from '@/services/api-client';
import { useSearchStore } from '@/stores/search-store';
import { useUIStore } from '@/stores/ui-store';
import { useCallback, useEffect } from 'react';
import { useDebounce } from './use-debounce';

export interface UseSearchOptions {
  apiClient: ApiClient;
  config: WidgetConfig;
  onSearchComplete?: (resultCount: number) => void;
  onError?: (error: Error) => void;
}

export function useSearch(options: UseSearchOptions) {
  const { apiClient, config, onSearchComplete, onError } = options;

  const { query, setQuery, setProducts, setTotal, setIsLoading, setError, setLastResponse } =
    useSearchStore();

  const { sortOrder } = useUIStore();

  const debouncedQuery = useDebounce(query, config.behavior.debounceDelay);

  /**
   * Execute search
   */
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.trim().length < config.behavior.minCharsForSearch) {
        setProducts([]);
        setTotal(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.search({
          q: searchQuery,
          sort: sortOrder !== 'relevance' ? sortOrder : undefined,
          limit: config.behavior.maxResults,
        });

        setProducts(response.products || []);
        setTotal(response.total || 0);
        setLastResponse(response);

        onSearchComplete?.(response.products?.length || 0);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Search failed';
        setError(message);
        setProducts([]);
        setTotal(0);

        onError?.(error instanceof Error ? error : new Error(message));
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, config, sortOrder, setProducts, setTotal, setIsLoading, setError, setLastResponse]
  );

  /**
   * Auto-search when query changes
   */
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return {
    query,
    setQuery,
    performSearch,
    isLoading: useSearchStore((state) => state.isLoading),
    error: useSearchStore((state) => state.error),
    products: useSearchStore((state) => state.products),
    total: useSearchStore((state) => state.total),
  };
}
