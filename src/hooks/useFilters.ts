import { useCallback, useState } from 'react';
import type { FilterState } from '../types';

interface UseFiltersReturn {
  filters: FilterState;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleFilterItem: <K extends keyof FilterState>(key: K, item: string) => void;
  clearFilters: () => void;
  resetPriceRange: (newMaxPrice?: number) => void;
  isAnyFilterActive: (searchQuery: string, maxPrice: number) => boolean;
}

interface UseFiltersOptions {
  initialMaxPrice?: number;
}

export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
  const { initialMaxPrice = 10000 } = options;

  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, initialMaxPrice],
    colors: [],
    sizes: [],
    brands: [],
    genders: [],
    tags: [],
    stockStatus: [],
    featuredProducts: [],
    saleStatus: [],
  });

  // Update a specific filter (for direct setting like priceRange)
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Toggle a filter item in an array (for categories, brands, etc.)
  const toggleFilterItem = useCallback(<K extends keyof FilterState>(key: K, item: string) => {
    setFilters((prev) => {
      const currentArray = prev[key] as unknown as string[];
      if (!Array.isArray(currentArray)) {
        return prev;
      }
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i: string) => i !== item)
        : [...currentArray, item];
      return {
        ...prev,
        [key]: newArray as FilterState[K],
      };
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      categories: [],
      priceRange: [0, maxPrice],
      colors: [],
      sizes: [],
      brands: [],
      genders: [],
      tags: [],
      stockStatus: [],
      featuredProducts: [],
      saleStatus: [],
    });
  }, [maxPrice]);

  // Reset only price range (accepts new max price)
  const resetPriceRange = useCallback(
    (newMaxPrice?: number) => {
      const targetMax = newMaxPrice ?? maxPrice;
      setFilters((prev) => ({
        ...prev,
        priceRange: [prev.priceRange[0], targetMax],
      }));
      if (newMaxPrice !== undefined) {
        setMaxPrice(newMaxPrice);
      }
    },
    [maxPrice]
  );

  // Check if any filter is active
  const isAnyFilterActive = useCallback(
    (searchQuery: string, currentMaxPrice: number) => {
      return (
        !!searchQuery ||
        filters.categories.length > 0 ||
        filters.brands.length > 0 ||
        filters.colors.length > 0 ||
        filters.sizes.length > 0 ||
        filters.tags.length > 0 ||
        filters.priceRange[1] < currentMaxPrice ||
        filters.stockStatus.length > 0 ||
        filters.featuredProducts.length > 0 ||
        filters.saleStatus.length > 0
      );
    },
    [filters]
  );

  return {
    filters,
    maxPrice,
    setMaxPrice,
    updateFilter,
    toggleFilterItem,
    clearFilters,
    resetPriceRange,
    isAnyFilterActive,
  };
}
